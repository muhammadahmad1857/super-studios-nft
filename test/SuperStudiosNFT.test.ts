import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("NFT Migration Comparison Tests", function () {
  // We use 'any' here to avoid compilation errors if Typechain artifacts aren't generated yet.
  // This allows us to call .mint(), .batchMint(), etc. without TS complaining they don't exist on the base Contract type.
  let oldContract: any;
  let newContract: any;
  
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    addr1 = signers[1];
    addr2 = signers[2];

    // Deploy Old Contract (Solidity 0.6.12)
    // Note: We use the explicit path to ensure Hardhat picks the correct file
    const OldNFTFactory = await ethers.getContractFactory("contracts/oldNFT.sol:NFT");
    oldContract = await OldNFTFactory.deploy();
    await oldContract.waitForDeployment();

    // Deploy New Contract (Solidity 0.8.20)
    const NewNFTFactory = await ethers.getContractFactory("contracts/newNFT.sol:NFT");
    newContract = await NewNFTFactory.deploy();
    await newContract.waitForDeployment();
  });

  // Helper function to compare results from both contracts
  // We use ...args: any[] to accept any number of arguments for the smart contract functions
  // Helper function to compare results from both contracts
  const compare = async (method: string, ...args: any[]) => {
    let resOld: any;
    let resNew: any;

    try {
      // Handle the function name change for Base URI
      if (method === "setBaseURI") {
        // === FIX IS HERE ===
        // We use string access ["baseURI(string)"] to tell Ethers v6 
        // specifically to use the SETTER, not the getter.
        const txOld = await oldContract["baseURI(string)"](...args);
        await txOld.wait();
        
        // New contract uses 'setBaseURI' (not overloaded, so safe to call directly)
        const txNew = await newContract.setBaseURI(...args);
        await txNew.wait();
        return;
      }

      // Check if the method exists on the old contract instance
      if (typeof oldContract[method] !== 'function') {
        throw new Error(`Method ${method} does not exist on old contract`);
      }

      // Execute Old
      const resultOld = await oldContract[method](...args);
      
      // Execute New
      const resultNew = await newContract[method](...args);

      // If it's a transaction response (has .wait), we wait for it
      if (resultOld && typeof resultOld.wait === 'function') {
        await resultOld.wait();
        await resultNew.wait();
      } else {
        return { resultOld, resultNew };
      }

    } catch (e) {
      console.log(`Error calling method: ${method}`);
      throw e;
    }
  };
  it("1. Should have the same Name and Symbol", async function () {
    expect(await oldContract.name()).to.equal(await newContract.name());
    expect(await oldContract.symbol()).to.equal(await newContract.symbol());
    expect(await oldContract.name()).to.equal("NFT");
  });

  it("2. Single Mint: Should generate same IDs and Balances", async function () {
    const tokenURI = "ipfs://meta-1";
    const ownerAddress = await owner.getAddress();

    // Mint on both
    await compare("mint", tokenURI);

    // 1. Check Owner
    expect(await oldContract.ownerOf(0)).to.equal(ownerAddress);
    expect(await newContract.ownerOf(0)).to.equal(ownerAddress);

    // 2. Check Balance
    expect(await oldContract.balanceOf(ownerAddress)).to.equal(1n); // 1n for BigInt
    expect(await newContract.balanceOf(ownerAddress)).to.equal(1n);

    // 3. Check Token URI
    expect(await oldContract.tokenURI(0)).to.equal(tokenURI);
    expect(await newContract.tokenURI(0)).to.equal(tokenURI);
  });

  it("3. Batch Mint: Should mint multiple tokens with sequential IDs", async function () {
    const batchURI = "ipfs://batch";
    const amount = 5;
    const ownerAddress = await owner.getAddress();

    // Batch mint on both
    await compare("batchMint", batchURI, amount);

    // Check Total Supply
    expect(await oldContract.totalSupply()).to.equal(BigInt(amount));
    expect(await newContract.totalSupply()).to.equal(BigInt(amount));

    // Check last ID (should be 4 because 0,1,2,3,4)
    expect(await oldContract.ownerOf(4)).to.equal(ownerAddress);
    expect(await newContract.ownerOf(4)).to.equal(ownerAddress);

    // Check URI of the last token
    expect(await oldContract.tokenURI(4)).to.equal(batchURI);
    expect(await newContract.tokenURI(4)).to.equal(batchURI);
  });

  it("4. Enumeration: Should retrieve tokens by index identically", async function () {
    const ownerAddress = await owner.getAddress();
    
    // Mint 3 tokens
    await compare("batchMint", "uri", 3);

    // Check tokenByIndex (Global list)
    // Index 1 should be ID 1
    expect(await oldContract.tokenByIndex(1)).to.equal(1n);
    expect(await newContract.tokenByIndex(1)).to.equal(1n);

    // Check tokenOfOwnerByIndex (User list)
    expect(await oldContract.tokenOfOwnerByIndex(ownerAddress, 2)).to.equal(2n);
    expect(await newContract.tokenOfOwnerByIndex(ownerAddress, 2)).to.equal(2n);
  });

  it("5. Base URI: Should handle Base URI concatenation correctly", async function () {
    const base = "https://api.example.com/";
    const specific = "123.json";

    // Mint token 0 with specific URI
    await compare("mint", specific);

    // Set Base URI
    // Our compare helper handles the naming difference: baseURI() vs setBaseURI()
    await compare("setBaseURI", base); 

    const uriOld = await oldContract.tokenURI(0);
    const uriNew = await newContract.tokenURI(0);

    expect(uriOld).to.equal(base + specific);
    expect(uriNew).to.equal(base + specific);
  });

  it("6. Mixed Scenario: Mint, Batch, and BaseURI", async function () {
    // 1. Mint one
    await compare("mint", "one");
    // 2. Batch mint 2
    await compare("batchMint", "batch", 2);
    
    // IDs exist: 0, 1, 2
    
    expect(await oldContract.totalSupply()).to.equal(3n);
    expect(await newContract.totalSupply()).to.equal(3n);

    // Verify ID 2 (created via batch) has URI "batch"
    expect(await oldContract.tokenURI(2)).to.equal("batch");
    expect(await newContract.tokenURI(2)).to.equal("batch");

    // Set Base URI
    await compare("setBaseURI", "http://host/");

    // Verify concatenation for ID 0
    expect(await oldContract.tokenURI(0)).to.equal("http://host/one");
    expect(await newContract.tokenURI(0)).to.equal("http://host/one");
  });
});