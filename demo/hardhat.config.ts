import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC,
      chainId: 80001,
      accounts: process.env.MUMBAI_PRIVATE_KEY
        ? [process.env.MUMBAI_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY,
  }
};

export default config;
