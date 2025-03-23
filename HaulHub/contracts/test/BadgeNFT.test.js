const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BadgeNFT", function () {
  let BadgeNFT;
  let badgeNFT;
  let owner;
  let approvedIssuer;
  let user1;
  let user2;
  
  // Badge types enum
  const BadgeType = {
    SpeedDemon: 0,
    EcoWarrior: 1,
    LoadLord: 2,
    FrequentHauler: 3,
    ReliableHauler: 4,
    QuickClaimer: 5
  };

  beforeEach(async function () {
    // Get contract factory
    BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    
    // Get signers
    [owner, approvedIssuer, user1, user2] = await ethers.getSigners();
    
    // Deploy the contract
    badgeNFT = await BadgeNFT.deploy();
    await badgeNFT.deployed();
    
    // Add approved issuer
    await badgeNFT.addIssuer(approvedIssuer.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await badgeNFT.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await badgeNFT.name()).to.equal("HaulHub Badge");
      expect(await badgeNFT.symbol()).to.equal("HHBADGE");
    });
    
    it("Should set the approved issuer", async function () {
      expect(await badgeNFT.approvedIssuers(approvedIssuer.address)).to.equal(true);
    });
  });

  describe("Badge Management", function () {
    it("Should allow owner to add and remove issuers", async function () {
      await badgeNFT.addIssuer(user1.address);
      expect(await badgeNFT.approvedIssuers(user1.address)).to.equal(true);
      
      await badgeNFT.removeIssuer(user1.address);
      expect(await badgeNFT.approvedIssuers(user1.address)).to.equal(false);
    });
    
    it("Should not allow non-owner to add issuers", async function () {
      await expect(
        badgeNFT.connect(user1).addIssuer(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should issue a badge to a user", async function () {
      const badgeType = BadgeType.SpeedDemon;
      const level = 1;
      const metadataURI = "ipfs://QmBadgeMetadata1";
      
      // Issue badge
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        badgeType,
        level,
        metadataURI
      );
      
      // Check badge ownership
      expect(await badgeNFT.balanceOf(user1.address)).to.equal(1);
      
      // Check token URI
      const tokenId = 1; // First token
      expect(await badgeNFT.tokenURI(tokenId)).to.equal(metadataURI);
      
      // Check badge details
      const badge = await badgeNFT.getBadgeDetails(tokenId);
      expect(badge.id).to.equal(tokenId);
      expect(badge.owner).to.equal(user1.address);
      expect(badge.badgeType).to.equal(badgeType);
      expect(badge.level).to.equal(level);
      expect(badge.metadataURI).to.equal(metadataURI);
    });
    
    it("Should not allow unauthorized accounts to issue badges", async function () {
      await expect(
        badgeNFT.connect(user1).issueBadge(
          user2.address,
          BadgeType.SpeedDemon,
          1,
          "ipfs://QmUnauthorizedBadge"
        )
      ).to.be.revertedWith("Not authorized");
    });
    
    it("Should verify if a user has a specific badge type", async function () {
      // Issue badge
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.SpeedDemon,
        1,
        "ipfs://QmTestBadge"
      );
      
      // Check if user has badge
      const [hasBadge, level] = await badgeNFT.hasBadge(user1.address, BadgeType.SpeedDemon);
      expect(hasBadge).to.equal(true);
      expect(level).to.equal(1);
      
      // Check for a badge type that user doesn't have
      const [hasOtherBadge, otherLevel] = await badgeNFT.hasBadge(user1.address, BadgeType.EcoWarrior);
      expect(hasOtherBadge).to.equal(false);
      expect(otherLevel).to.equal(0);
    });
    
    it("Should level up an existing badge", async function () {
      // Issue initial badge
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.SpeedDemon,
        1,
        "ipfs://QmLevel1Badge"
      );
      
      // Level up the badge
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.SpeedDemon,
        2,
        "ipfs://QmLevel2Badge"
      );
      
      // Check if badge was leveled up
      const [hasBadge, level] = await badgeNFT.hasBadge(user1.address, BadgeType.SpeedDemon);
      expect(hasBadge).to.equal(true);
      expect(level).to.equal(2);
      
      // Check that only one badge exists (upgraded, not new)
      expect(await badgeNFT.balanceOf(user1.address)).to.equal(1);
      
      // Check badge details
      const badge = await badgeNFT.getBadgeDetails(1); // Still token ID 1
      expect(badge.level).to.equal(2);
      expect(badge.metadataURI).to.equal("ipfs://QmLevel2Badge");
    });
    
    it("Should not allow downgrading a badge level", async function () {
      // Issue level 2 badge
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.SpeedDemon,
        2,
        "ipfs://QmLevel2Badge"
      );
      
      // Try to downgrade to level 1
      await expect(
        badgeNFT.connect(approvedIssuer).issueBadge(
          user1.address,
          BadgeType.SpeedDemon,
          1,
          "ipfs://QmLevel1Badge"
        )
      ).to.be.revertedWith("New level must be higher");
    });
    
    it("Should get all badges for a user", async function () {
      // Issue multiple badges
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.SpeedDemon,
        1,
        "ipfs://QmSpeedDemonBadge"
      );
      
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.EcoWarrior,
        1,
        "ipfs://QmEcoWarriorBadge"
      );
      
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.FrequentHauler,
        2,
        "ipfs://QmFrequentHaulerBadge"
      );
      
      // Get all badges
      const badges = await badgeNFT.getUserBadges(user1.address);
      
      // Should have 3 badges
      expect(badges.length).to.equal(3);
      
      // Verify each badge ID
      expect(badges[0]).to.equal(1);
      expect(badges[1]).to.equal(2);
      expect(badges[2]).to.equal(3);
    });
  });
  
  describe("Badge Transferability", function() {
    it("Should not allow badge transfer", async function() {
      // Issue badge
      await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.SpeedDemon,
        1,
        "ipfs://QmTestBadge"
      );
      
      // Try to transfer
      await expect(
        badgeNFT.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("Badges are not transferable");
    });
    
    it("Should allow minting (transfer from zero address)", async function() {
      // This is indirectly tested in all issueBadge tests
      // Transfer from zero address is allowed in _beforeTokenTransfer
      const tx = await badgeNFT.connect(approvedIssuer).issueBadge(
        user1.address,
        BadgeType.SpeedDemon,
        1,
        "ipfs://QmTestBadge"
      );
      
      // Check that the transaction was successful
      await tx.wait();
      expect(await badgeNFT.balanceOf(user1.address)).to.equal(1);
    });
  });
});