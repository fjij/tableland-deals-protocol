// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@tableland/evm/contracts/ITablelandController.sol";
import "@tableland/evm/contracts/policies/Policies.sol";

contract DemoController is ITablelandController {
    function getPolicy(
        address caller
    ) external payable returns (Policy memory) {
        string[] memory updatableColumns = new string[](1);
        updatableColumns[0] = "owner";
        string memory rule = string(
            bytes.concat("owner = ", bytes(Strings.toHexString(caller)))
        );
        return ITablelandController.Policy({
            allowInsert: true,
            allowUpdate: true,
            allowDelete: true,
            whereClause: rule,
            withCheck: rule,
            updatableColumns: updatableColumns
        });
    }
}
