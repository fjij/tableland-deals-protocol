// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@tableland/evm/contracts/ITablelandController.sol";

contract MockController is ITablelandController {
    mapping(address => Policy) policies;

    function setPolicy(address caller, Policy memory policy) external {
        policies[caller] = policy;
    }

    function getPolicy(
        address caller
    ) external payable returns (Policy memory) {
        return policies[caller];
    }
}
