// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@tableland/evm/contracts/ITablelandController.sol";
import "@tableland/evm/contracts/ITablelandTables.sol";

import "./ProxyController.sol";

contract TablelandDeals {
    // State -------------------------------------------------------------------

    ITablelandTables public tableland;
    address public proxyImplementation;

    mapping(uint256 => address) private controllers;
    mapping(bytes32 => bool) private consumed;

    // Initialization ----------------------------------------------------------

    constructor(address _tableland, address _proxyImplementation) {
        tableland = ITablelandTables(_tableland);
        proxyImplementation = _proxyImplementation;
    }

    // Deals -------------------------------------------------------------------

    function computeMessage(
        uint256[] memory tableIds,
        string[] memory statements,
        ITablelandController.Policy[] memory policies,
        address[] memory accounts, 
        bytes32 salt
    ) public pure returns (bytes32){
        return keccak256(abi.encode(
            tableIds,
            statements,
            policies,
            accounts,
            salt
        ));
    }

    event ExecuteDeal(
        uint256[] tableIds,
        string[] statements,
        ITablelandController.Policy[] policies,
        address[] accounts, 
        bytes32 salt,
        bytes[] signatures
    );

    function executeDeal(
        uint256[] calldata tableIds,
        string[] calldata statements,
        ITablelandController.Policy[] memory policies,
        address[] calldata accounts, 
        bytes32 salt,
        bytes[] calldata signatures
    ) external {
        // Validate signatures
        bytes32 message = computeMessage(
            tableIds,
            statements,
            policies,
            accounts,
            salt
        );
        require(!consumed[message], "already executed");
        consumed[message] = true;
        for(uint256 i = 0; i < tableIds.length; i ++) {
            address signer = ECDSA.recover(
                ECDSA.toEthSignedMessageHash(message),
                signatures[i]
            );
            require(signer == accounts[i], "invalid signature");
        }

        // Check that all tables have the proxy installed
        for(uint256 i = 0; i < tableIds.length; i ++) {
            require(
                tableland.getController(tableIds[i]) == getProxy(tableIds[i]),
                "missing proxy"
            );
        }

        // Check that all policies are valid
        for(uint256 i = 0; i < tableIds.length; i ++) {
            require(
                keccak256(
                    abi.encode(_getControllerPolicy(tableIds[i], accounts[i]))
                ) == keccak256(abi.encode(policies[i])),
                "invalid policy"
            );
        }

        // Execute deal
        for(uint256 i = 0; i < tableIds.length; i ++) {
            tableland.runSQL(address(this), tableIds[i], statements[i]);
        }

        emit ExecuteDeal(
            tableIds,
            statements,
            policies,
            accounts, 
            salt,
            signatures
        );
    }

    /// @notice Get the policy for a 
    /// @notice 
    function getPolicy(
        uint256 tableId,
        address caller
    ) external returns (ITablelandController.Policy memory) {
        if (caller == address(this)) {
            return ITablelandController.Policy({
                allowInsert: true,
                allowUpdate: true,
                allowDelete: true,
                whereClause: "",
                withCheck: "",
                updatableColumns: new string[](0)
            });
        }
        return _getControllerPolicy(tableId, caller);
    }

    // Proxies -----------------------------------------------------------------

    /// @notice Get the controller proxy for a specific table - doesn't
    /// guarantee that the proxy exists
    /// @param tableId Table ID
    /// @return The address of the proxy
    function getProxy(uint256 tableId) public view returns (address) {
        return Clones.predictDeterministicAddress(
            proxyImplementation,
            bytes32(tableId)
        );
    }

    event CreateProxy(uint256 tableId);

    /// @notice Create the controller proxy for a specific table
    /// @param tableId Table ID
    function createProxy(uint256 tableId) public {
        address proxy = Clones.cloneDeterministic(
            proxyImplementation,
            bytes32(tableId)
        );
        ProxyController(proxy).initialize(
            address(this),
            tableId
        );
        emit CreateProxy(tableId);
    }

    // Controllers -------------------------------------------------------------

    event SetController(uint256 tableId, address controller);

    /// @notice See {ITablelandTables-setController}
    function setController(uint256 tableId, address controller) external {
        require(
            IERC721(address(tableland)).ownerOf(tableId) == msg.sender,
            "not table owner"
        );
        controllers[tableId] = controller;
        emit SetController(tableId, controller);
    }

    /// @notice See {ITablelandTables-getController}
    function getController(uint256 tableId) external view returns (address) {
        return controllers[tableId];
    }

    function _getControllerPolicy(
        uint256 tableId,
        address caller
    ) internal returns (ITablelandController.Policy memory) {
        address controller = controllers[tableId];
        if (controller == address(0)) {
            if (caller == IERC721(address(tableland)).ownerOf(tableId)) {
                return ITablelandController.Policy({
                    allowInsert: true,
                    allowUpdate: true,
                    allowDelete: true,
                    whereClause: "",
                    withCheck: "",
                    updatableColumns: new string[](0)
                });
            } else {
                return ITablelandController.Policy({
                    allowInsert: false,
                    allowUpdate: false,
                    allowDelete: false,
                    whereClause: "",
                    withCheck: "",
                    updatableColumns: new string[](0)
                });
            }
        }
        return ITablelandController(controller).getPolicy(caller);
    }
}
