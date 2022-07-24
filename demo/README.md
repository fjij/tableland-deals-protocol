# Demo

The demo is a table with ownable rows.

These rows can be traded atomically with the Tableland Deals Protocol.

## Contracts

### DemoController

| Chain           | Chain ID  | Smart Contract Address                                                                                                          |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Polygon Mumbai  | 80001     | [0x940Cdfc6ba11E461AE92a0D8959D3539C0CaAd5e](https://mumbai.polygonscan.com/address/0x940Cdfc6ba11E461AE92a0D8959D3539C0CaAd5e) |

## Tables

| Chain           | Chain ID  | Table ID | Schema                                      | Policy                                |
| --------------- | --------- | -------- | ------------------------------------------- | ------------------------------------- |
| Polygon Mumbai  | 80001     | 622      | `name text, owner text, primary key (name)` | allow all as long as `owner = caller` |
