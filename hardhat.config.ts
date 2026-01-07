import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20", // New Contract
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.7.6", // Old Contract
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      // Local testing network
    },
    apollo: {
      url: "https://mainnet-rpc.apolloscan.io", // ApolloChain RPC
      chainId: 62606, // ApolloChain ID
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};

export default config;