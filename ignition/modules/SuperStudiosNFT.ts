import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SuperStudiosModule = buildModule("SuperStudiosModule", (m) => {
  // 1. Get the account that is deploying (your wallet)
  const deployer = m.getAccount(0);

  // 2. Deploy the contract
  // The array [deployer] passes the wallet address to the constructor's 'initialOwner' argument
  const nft = m.contract("SuperStudiosNFT", [deployer]);

  return { nft };
});

export default SuperStudiosModule;