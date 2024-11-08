// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ScreamChicken is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    mapping(string => uint8) existingURIs;
    mapping(uint256 => uint256) public tokenPrices; // Maps token ID to its sale price
    mapping(uint256 => bool) public listedForSale; // Tracks if a token is listed for sale

    constructor() ERC721("ScreamChicken", "SCC") {}

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        existingURIs[uri] = 1;
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        // delete existingURIs[tokenURI(tokenId)]; // Remove the URI from existingURIs mapping
        delete tokenPrices[tokenId]; // Remove any price associated with the token
        listedForSale[tokenId] = false; // Unlist if the token was listed for sale
    }

    function isTokenBurned(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function getOwnerOfToken(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function isContentOwned(string memory uri) public view returns (bool) {
        return existingURIs[uri] == 1;
    }

    function payToMint(
        address recipient,
        string memory metadataURI
    ) public payable returns (uint256) {
        require(existingURIs[metadataURI] != 1, "NFT already minted!");
        require(msg.value >= 0.05 ether, "Need to pay up!");

        uint256 newItemId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        existingURIs[metadataURI] = 1;

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, metadataURI);

        emit Minting(newItemId, recipient, metadataURI);
        return newItemId;
    }

    event Minting(uint256 tokenId, address recipient, string metadataURI);

    function count() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Burn function accessible by token owner
    function burnToken(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not the owner");
        _burn(tokenId);
    }

    // List token for sale
    function sell(uint256 tokenId, uint256 price) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not the owner");
        require(price > 0, "Price must be greater than zero");

        tokenPrices[tokenId] = price;
        listedForSale[tokenId] = true;

        emit TokenListedForSale(tokenId, price);
    }

    event TokenListedForSale(uint256 tokenId, uint256 price);

    function cancelListing(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not the owner");
        require(listedForSale[tokenId], "Token is not listed for sale");

        listedForSale[tokenId] = false;
        delete tokenPrices[tokenId];

        emit TokenListingCanceled(tokenId);
    }

    event TokenListingCanceled(uint256 tokenId);

    // Buy function to purchase a listed token
    function buy(uint256 tokenId) public payable {
        require(listedForSale[tokenId], "Token not for sale");
        uint256 price = tokenPrices[tokenId];
        require(msg.value >= price, "Insufficient payment");

        address seller = ownerOf(tokenId);

        _transfer(seller, msg.sender, tokenId);
        payable(seller).transfer(price);

        listedForSale[tokenId] = false;
        delete tokenPrices[tokenId];

        emit TokenSold(tokenId, msg.sender, price);
    }

    event TokenSold(uint256 tokenId, address buyer, uint256 price);
}
