// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SuperStudiosNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    uint256 private _nextTokenId;

    // Mapping to track if an NFT has been "used" or "consumed"
    // This allows single-use access without burning the token (Souvenir mode)
    mapping(uint256 => bool) public isConsumed;

    event NFTConsumed(uint256 indexed tokenId, address consumedBy);

    constructor(address initialOwner)
        ERC721("SuperStudiosAccess", "SUPER")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mints a new NFT to a specific address. Only Owner/Admin can call.
     * @param to The address receiving the NFT
     * @param uri The IPFS/Cloud URL for the Audio/Video metadata
     */
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Marks a token as "used" without burning it.
     * Useful for concert tickets or access passes that become souvenirs.
     * Only the Admin/Owner can mark it as consumed to prevent user error.
     */
    function consumeNFT(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        require(!isConsumed[tokenId], "NFT already used");
        
        isConsumed[tokenId] = true;
        emit NFTConsumed(tokenId, msg.sender);
    }

    /**
     * @dev Verifies if a user owns a specific token and if it is still valid (unused).
     */
    function isValidAccess(address user, uint256 tokenId) public view returns (bool) {
        return (ownerOf(tokenId) == user && !isConsumed[tokenId]);
    }

    // The following functions are overrides required by Solidity.

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
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}