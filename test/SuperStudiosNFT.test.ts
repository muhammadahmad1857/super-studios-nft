import { expect } from "chai";
import { ethers } from "hardhat";
import { SuperStudiosNFT } from "../typechain-types";

describe("SuperStudiosNFT", function () {
  let nftContract: SuperStudiosNFT;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const NFTFactory = await ethers.getContractFactory("SuperStudiosNFT");
    nftContract = await NFTFactory.deploy(owner.address);
  });

  it("Should allow owner to mint an NFT", async function () {
    const metadataURI = "ipfs://QmVideoMetadata";
    await nftContract.safeMint(addr1.address, metadataURI);

    expect(await nftContract.ownerOf(0)).to.equal(addr1.address);
    expect(await nftContract.tokenURI(0)).to.equal(metadataURI);
  });

  it("Should NOT allow non-owner to mint", async function () {
    const metadataURI = "ipfs://QmHack";
    await expect(
      nftContract.connect(addr1).safeMint(addr2.address, metadataURI)
    ).to.be.revertedWithCustomError(nftContract, "OwnableUnauthorizedAccount");
  });

  it("Should handle Single Use (Consume) correctly", async function () {
    await nftContract.safeMint(addr1.address, "ipfs://ticket");

    // Check initial state
    expect(await nftContract.isConsumed(0)).to.equal(false);
    expect(await nftContract.isValidAccess(addr1.address, 0)).to.equal(true);

    // Admin marks as used
    await nftContract.consumeNFT(0);

    // Verify state changed
    expect(await nftContract.isConsumed(0)).to.equal(true);
    expect(await nftContract.isValidAccess(addr1.address, 0)).to.equal(false);
  });

  it("Should allow user to burn their own NFT", async function () {
    await nftContract.safeMint(addr1.address, "ipfs://burnme");
    
    // User burns token 0
    await nftContract.connect(addr1).burn(0);

    // Verify it doesn't exist
    await expect(nftContract.ownerOf(0)).to.be.revertedWithCustomError(nftContract, "ERC721NonexistentToken");
  });
});