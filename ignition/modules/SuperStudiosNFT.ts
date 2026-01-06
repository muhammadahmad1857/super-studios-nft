import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SuperStudiosModule = buildModule("SuperStudiosModule", (m) => {
  const deployer = m.getAccount(0);

  // Deploy the new 1155 Contract
  const nft = m.contract("SuperStudiosNFT", [deployer]);

  return { nft };
});

export default SuperStudiosModule;