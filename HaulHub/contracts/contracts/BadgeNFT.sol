// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BadgeNFT
 * @dev ERC721 token for HaulHub badges
 */
contract BadgeNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Badge types
    enum BadgeType { SpeedDemon, EcoWarrior, LoadLord, FrequentHauler, ReliableHauler, QuickClaimer }
    
    // Badge structure
    struct Badge {
        uint256 id;
        address owner;
        BadgeType badgeType;
        uint256 level;
        uint256 issuedAt;
        string metadataURI;
    }
    
    // Events
    event BadgeIssued(uint256 indexed tokenId, address indexed recipient, uint8 badgeType, uint256 level);
    event BadgeLevelUp(uint256 indexed tokenId, uint256 newLevel);
    
    // Mapping to track which badges a user has
    mapping(address => mapping(uint8 => uint256)) public userBadges;
    
    // Mapping to store badge data
    mapping(uint256 => Badge) public badges;
    
    // Mapping from token ID to approved addresses
    mapping(address => bool) public approvedIssuers;
    
    constructor() ERC721("HaulHub Badge", "HHBADGE") {}
    
    /**
     * @dev Add an approved issuer
     * @param _issuer Address of the approved issuer
     */
    function addIssuer(address _issuer) external onlyOwner {
        approvedIssuers[_issuer] = true;
    }
    
    /**
     * @dev Remove an approved issuer
     * @param _issuer Address of the issuer to remove
     */
    function removeIssuer(address _issuer) external onlyOwner {
        approvedIssuers[_issuer] = false;
    }
    
    /**
     * @dev Issue a badge to a user
     * @param _recipient Address of the badge recipient
     * @param _badgeType Type of badge (see BadgeType enum)
     * @param _level Badge level
     * @param _metadataURI IPFS URI for badge metadata
     */
    function issueBadge(
        address _recipient,
        uint8 _badgeType,
        uint256 _level,
        string memory _metadataURI
    ) external {
        require(owner() == msg.sender || approvedIssuers[msg.sender], "Not authorized");
        require(_badgeType < 6, "Invalid badge type");
        require(_level > 0, "Level must be greater than 0");
        require(_recipient != address(0), "Invalid recipient");
        
        // Check if user already has this badge type
        if (userBadges[_recipient][_badgeType] != 0) {
            // If already has badge, level it up
            uint256 existingTokenId = userBadges[_recipient][_badgeType];
            Badge storage existingBadge = badges[existingTokenId];
            
            // Only level up if new level is higher
            require(_level > existingBadge.level, "New level must be higher");
            
            existingBadge.level = _level;
            
            // Update token URI
            _setTokenURI(existingTokenId, _metadataURI);
            
            emit BadgeLevelUp(existingTokenId, _level);
        } else {
            // Issue new badge
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            
            _safeMint(_recipient, newTokenId);
            _setTokenURI(newTokenId, _metadataURI);
            
            Badge memory newBadge = Badge({
                id: newTokenId,
                owner: _recipient,
                badgeType: BadgeType(_badgeType),
                level: _level,
                issuedAt: block.timestamp,
                metadataURI: _metadataURI
            });
            
            badges[newTokenId] = newBadge;
            userBadges[_recipient][_badgeType] = newTokenId;
            
            emit BadgeIssued(newTokenId, _recipient, _badgeType, _level);
        }
    }
    
    /**
     * @dev Get badge details
     * @param _tokenId ID of the badge
     * @return Badge details
     */
    function getBadgeDetails(uint256 _tokenId) external view returns (Badge memory) {
        require(_exists(_tokenId), "Badge does not exist");
        return badges[_tokenId];
    }
    
    /**
     * @dev Check if a user has a specific badge
     * @param _user Address of the user
     * @param _badgeType Type of badge
     * @return Whether the user has the badge and its level
     */
    function hasBadge(address _user, uint8 _badgeType) external view returns (bool, uint256) {
        uint256 tokenId = userBadges[_user][_badgeType];
        if (tokenId == 0) {
            return (false, 0);
        }
        return (true, badges[tokenId].level);
    }
    
    /**
     * @dev Get all badges of a user
     * @param _user Address of the user
     * @return Array of badge IDs
     */
    function getUserBadges(address _user) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count badges
        for (uint8 i = 0; i < 6; i++) {
            if (userBadges[_user][i] != 0) {
                count++;
            }
        }
        
        // Create result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        // Fill result array
        for (uint8 i = 0; i < 6; i++) {
            if (userBadges[_user][i] != 0) {
                result[index] = userBadges[_user][i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Override transfer function to make badges non-transferable
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0) || to == address(0), "Badges are not transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}