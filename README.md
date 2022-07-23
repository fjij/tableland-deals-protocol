# Tableland Deals Protocol

An extenstion to Tableland that allows the execution of complex operations that
require write access from multiple parties.

## Contracts

### TablelandDeals

| Chain           | Chain ID  | Smart Contract Address                                                                                                          |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Polygon Mumbai  | 80001     | [0x09B2ccC4eAe2fa454CD62aa97bB9D37ff4EbEEB5](https://mumbai.polygonscan.com/address/0x09B2ccC4eAe2fa454CD62aa97bB9D37ff4EbEEB5) |

### ProxyController (Implementation)

| Chain           | Chain ID  | Smart Contract Address                                                                                                          |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Polygon Mumbai  | 80001     | [0x94302E4AF39EdF73a07DAaEeBD2A16dFAB286e5C](https://mumbai.polygonscan.com/address/0x94302E4AF39EdF73a07DAaEeBD2A16dFAB286e5C) |

## Register a table

```js
// Create a proxy controller for the table
TablelandDeals.createProxy(tableId);

// Set the proxy controller for the address (table owner only)
const proxyAddress = TablelandDeals.createProxy(tableId);
TablelandTables.setController(tableId, proxyAddress);

// Optional: set the table controller (table owner only)
TablelandDeals.setController(tableId, controllerAddress);
```
