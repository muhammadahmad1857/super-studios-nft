import { expect } from "chai";
import { ethers } from "hardhat";
import { SuperStudiosNFT } from "../typechain-types";

describe("SuperStudiosNFT", function () {
  let nftContract: SuperStudiosNFT;
  let owner: any, addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SuperStudiosNFT");
    nftContract = await Factory.deploy(owner.address);
  });

  it("Should mint a Video NFT (ID 1) with 100 copies", async function () {
    const videoURI = "ipfs://QmVideoMetadata";
    
    // Mint 100 copies of ID 1 to addr1
    await nftContract.mint(addr1.address, 1, 100, videoURI, "0x");

    expect(await nftContract.balanceOf(addr1.address, 1)).to.equal(100);
    expect(await nftContract.uri(1)).to.equal(videoURI);
  });

  it("Should handle Single Use (Consume) without burning", async function () {
    // Give user 1 ticket
    await nftContract.mint(addr1.address, 2, 1, "ipfs://ticket", "0x");

    // Check valid
    expect(await nftContract.isValidAccess(addr1.address, 2)).to.equal(true);

    // Admin marks as used
    await nftContract.consumeAccess(addr1.address, 2);

    // Check invalid but user still owns it (Souvenir)
    expect(await nftContract.isValidAccess(addr1.address, 2)).to.equal(false);
    expect(await nftContract.balanceOf(addr1.address, 2)).to.equal(1);
  });

  it("Should allow burning (Destroying) if preferred", async function () {
    await nftContract.mint(addr1.address, 3, 5, "ipfs://burnable", "0x");
    
    // User burns 1 copy
    await nftContract.connect(addr1).burn(addr1.address, 3, 1);

    expect(await nftContract.balanceOf(addr1.address, 3)).to.equal(4);
  });
});