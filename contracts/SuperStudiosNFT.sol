// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract SuperStudiosNFT is ERC1155, Ownable, ERC1155Burnable, ERC1155Supply {
    
    // Name and Symbol are not native to ERC1155 but nice for Explorers (Apolloscan)
    string public name = "Super Studios Collection";
    string public symbol = "SUPER";

    // Mapping for individual token URIs (TokenID => IPFS URL)
    mapping(uint256 => string) private _tokenURIs;

    // Mapping to track usage: tokenId => userAddress => isUsed
    // This allows a user to keep the NFT as a souvenir after "using" it.
    mapping(uint256 => mapping(address => bool)) public hasConsumed;

    event NFTConsumed(uint256 indexed tokenId, address indexed user);

    constructor(address initialOwner) 
        ERC1155("") 
        Ownable(initialOwner) 
    {}

    /**
     * @dev Mint a new NFT Type (e.g., ID 1 = Video, ID 2 = Audio)
     * @param account Who gets the NFTs
     * @param id The Unique ID (e.g., 1)
     * @param amount How many copies to mint (e.g., 100)
     * @param tokenUri The Metadata URL (ipfs://...) for the MP4/Audio
     */
    function mint(
        address account, 
        uint256 id, 
        uint256 amount, 
        string memory tokenUri, 
        bytes memory data
    )
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
        _tokenURIs[id] = tokenUri;
    }

    /**
     * @dev Batch Mint (Mint ID 1 and ID 2 at the same time)
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        string[] memory uris,
        bytes memory data
    )
        public
        onlyOwner
    {
        require(ids.length == uris.length, "URIs must match IDs");
        _mintBatch(to, ids, amounts, data);
        for (uint256 i = 0; i < ids.length; i++) {
            _tokenURIs[ids[i]] = uris[i];
        }
    }

    /**
     * @dev "Uses" the NFT without burning it (Souvenir Mode).
     * Only Admin can call this when scanning the user's wallet.
     */
    function consumeAccess(address account, uint256 id) public onlyOwner {
        require(balanceOf(account, id) > 0, "User does not own this NFT");
        require(!hasConsumed[id][account], "Access already used");

        hasConsumed[id][account] = true;
        emit NFTConsumed(id, account);
    }

    /**
     * @dev Check if a user has valid, unused access
     */
    function isValidAccess(address account, uint256 id) public view returns (bool) {
        return (balanceOf(account, id) > 0 && !hasConsumed[id][account]);
    }

    /**
     * @dev Returns the custom URI for each token ID.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // The following function overrides are required by Solidity.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}