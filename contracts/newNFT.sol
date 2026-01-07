// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin Contracts
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    // In OpenZeppelin v5, Ownable requires passing the initial owner address
    constructor() ERC721("NFT", "NFT") Ownable(msg.sender) {}

    // Public wrapper to mint a single token
    function mint(string memory uri) public returns (bool) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        return true;
    }

    // Batch minting function
    function batchMint(string memory uri, uint256 numOfTokens) public returns (bool) {
        require(numOfTokens > 0, "Must mint at least one token");
        
        for (uint256 i = 0; i < numOfTokens; i++) {
            mint(uri);
        }
        return true;
    }

    // Function to update the Base URI
    function setBaseURI(string memory baseUri) public onlyOwner {
        _baseTokenURI = baseUri;
    }

    // Internal override to return the base URI string
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // =============================================================
    //                      OVERRIDES
    // =============================================================
    // The following functions are overrides required by Solidity 
    // because inheriting from multiple extensions creates conflicts.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}