// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@tableland/evm/contracts/ITablelandController.sol";

contract PolicyGetter {
    event GetPolicy(ITablelandController.Policy policy);

    function getPolicy(
        address controller,
        address caller
    ) external payable  {
        emit GetPolicy(ITablelandController(controller).getPolicy(caller));
    }
}
