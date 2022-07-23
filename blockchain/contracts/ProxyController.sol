// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@tableland/evm/contracts/ITablelandController.sol";

import "./TablelandDeals.sol";

contract ProxyController is ITablelandController, Initializable {
    address public tablelandDeals;
    uint256 tableId;

    constructor() {
        _disableInitializers();
    }

    /// @param _tablelandDeals Address of the {TablelandDeals} contract
    /// @param _tableId Table ID
    function initialize(
        address _tablelandDeals,
        uint256 _tableId
    ) external initializer {
        tablelandDeals = _tablelandDeals;
        tableId = _tableId;
    }

    /// @notice See {ITablelandController}
    function getPolicy(
        address caller
    ) external payable override returns (Policy memory) {
        return TablelandDeals(tablelandDeals).getPolicy(tableId, caller);
    }
}
