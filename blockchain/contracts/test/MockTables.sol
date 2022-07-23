// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MockTables {
    address owner;

    function setOwner(address _owner) external {
        owner = _owner;
    }

    function ownerOf(uint256) external view returns (address) {
        return owner;
    }

    event RunSQL(address caller, uint256 tableId, string statement);

    function runSQL(
        address caller,
        uint256 tableId,
        string memory statement
    ) external {
        emit RunSQL(caller, tableId, statement);
    }

    mapping(uint256 => address) private controllers;

    function setController(uint256 tableId, address controller) external {
        controllers[tableId] = controller;
    }

    function getController(uint256 tableId) external view returns (address) {
        return controllers[tableId];
    }
}
