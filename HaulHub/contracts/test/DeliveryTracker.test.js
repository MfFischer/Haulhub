const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeliveryTracker", function () {
  let HaulHub;
  let BadgeNFT;
  let DeliveryTracker;
  let haulHub;
  let badgeNFT;
  let deliveryTracker;
  let owner;
  let poster;
  let hauler;
  let addr3;
  let jobId;

  // Sample location hashes (these would be IPFS hashes in production)
  const initialLocationHash = "QmP4UfVHRGVjpNLrTfpDrWmKUk4yf9BoRa74KVPiTRNcx1";
  const pickupLocationHash = "QmWqVgN8JLW7RxvpKnMRc7uYAa4JcfUY6j6rPKM9dZwpV6";
  const dropoffLocationHash = "QmZzWFjPUKvqLmRJd1EKmPtaGSEwuD3QQJj3oscn1jJnX5";
  const completionProofHash = "QmVJjZWR5Lh9L6TkXBZZKFQtNV7YTrDNKqV6JxJyhZwUNx";

  beforeEach(async function () {
    // Get contract factories
    HaulHub = await ethers.getContractFactory("HaulHub");
    BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    DeliveryTracker = await ethers.getContractFactory("DeliveryTracker");
    
    // Get signers
    [owner, poster, hauler, addr3] = await ethers.getSigners();
    
    // Deploy contracts
    badgeNFT = await BadgeNFT.deploy();
    await badgeNFT.deployed();
    
    haulHub = await HaulHub.deploy(owner.address);
    await haulHub.deployed();
    
    deliveryTracker = await DeliveryTracker.deploy(haulHub.address, owner.address);
    await deliveryTracker.deployed();
    
    // Add HaulHub as badge issuer
    await badgeNFT.addIssuer(haulHub.address);
    
    // Create a job for testing
    const jobPayment = ethers.utils.parseEther("0.1");
    const locationHash = "QmTestLocationHash";
    const isRush = false;
    
    // Poster creates a job
    await haulHub.connect(poster).createJob(locationHash, isRush, { value: jobPayment });
    
    // Store job ID
    jobId = 1; // First job has ID 1
    
    // Hauler accepts the job
    await haulHub.connect(hauler).acceptJob(jobId);
  });

  describe("Deployment", function () {
    it("Should set the right HaulHub address", async function () {
      const haulHubAddress = await deliveryTracker.haulHub();
      expect(haulHubAddress).to.equal(haulHub.address);
    });

    it("Should set the right verifier address", async function () {
      const verifierAddress = await deliveryTracker.verifier();
      expect(verifierAddress).to.equal(owner.address);
    });
  });

  describe("Delivery Tracking", function () {
    it("Should start tracking a delivery", async function () {
      await deliveryTracker.connect(hauler).startDelivery(jobId, initialLocationHash);
      
      // Check status
      const status = await deliveryTracker.currentStatus(jobId);
      expect(status).to.equal(1); // InTransit status is 1
      
      // Check location update count
      const locationCount = await deliveryTracker.getLocationUpdateCount(jobId);
      expect(locationCount).to.equal(1);
    });

    it("Should not allow non-hauler to start tracking", async function () {
      await expect(
        deliveryTracker.connect(addr3).startDelivery(jobId, initialLocationHash)
      ).to.be.revertedWith("Caller is not the job hauler");
    });

    it("Should allow updating location during delivery", async function () {
      // Start delivery
      await deliveryTracker.connect(hauler).startDelivery(jobId, initialLocationHash);
      
      // Update location
      await deliveryTracker.connect(hauler).updateLocation(jobId, pickupLocationHash, 85, "Moving to pickup");
      
      // Check location update count
      const locationCount = await deliveryTracker.getLocationUpdateCount(jobId);
      expect(locationCount).to.equal(2);
    });

    it("Should allow confirming pickup with proof", async function () {
      // Start delivery
      await deliveryTracker.connect(hauler).startDelivery(jobId, initialLocationHash);
      
      // Confirm pickup
      await deliveryTracker.connect(hauler).confirmPickup(
        jobId,
        pickupLocationHash,
        "QmPickupProofHash",
        "Items picked up successfully"
      );
      
      // Check status
      const status = await deliveryTracker.currentStatus(jobId);
      expect(status).to.equal(2); // PickupConfirmed status is 2
      
      // Check milestone count
      const milestoneCount = await deliveryTracker.getMilestoneCount(jobId);
      expect(milestoneCount).to.equal(1);
    });

    it("Should allow marking arrival at dropoff", async function () {
      // Start delivery and confirm pickup
      await deliveryTracker.connect(hauler).startDelivery(jobId, initialLocationHash);
      await deliveryTracker.connect(hauler).confirmPickup(
        jobId,
        pickupLocationHash,
        "QmPickupProofHash",
        "Items picked up successfully"
      );
      
      // Mark arrival at dropoff
      await deliveryTracker.connect(hauler).arriveAtDropoff(
        jobId,
        dropoffLocationHash,
        "QmArrivalProofHash",
        "Arrived at destination"
      );
      
      // Check status
      const status = await deliveryTracker.currentStatus(jobId);
      expect(status).to.equal(3); // AtDropoff status is 3
    });

    it("Should complete delivery with proof", async function () {
      // Start delivery process
      await deliveryTracker.connect(hauler).startDelivery(jobId, initialLocationHash);
      await deliveryTracker.connect(hauler).confirmPickup(
        jobId,
        pickupLocationHash,
        "QmPickupProofHash",
        "Items picked up successfully"
      );
      await deliveryTracker.connect(hauler).arriveAtDropoff(
        jobId,
        dropoffLocationHash,
        "QmArrivalProofHash",
        "Arrived at destination"
      );
      
      // Complete delivery
      await deliveryTracker.connect(hauler).completeDelivery(
        jobId,
        dropoffLocationHash,
        completionProofHash,
        "Delivery completed, signature collected"
      );
      
      // Check status
      const status = await deliveryTracker.currentStatus(jobId);
      expect(status).to.equal(4); // Delivered status is 4
    });

    it("Should allow reporting failed delivery", async function () {
      // Start delivery
      await deliveryTracker.connect(hauler).startDelivery(jobId, initialLocationHash);
      
      // Report failure
      await deliveryTracker.connect(hauler).reportFailedDelivery(
        jobId,
        pickupLocationHash,
        "QmFailureProofHash",
        "Customer not available after multiple attempts"
      );
      
      // Check status
      const status = await deliveryTracker.currentStatus(jobId);
      expect(status).to.equal(5); // Failed status is 5
    });

    it("Should allow batch location updates", async function () {
      // Start delivery
      await deliveryTracker.connect(hauler).startDelivery(jobId, initialLocationHash);
      
      // Current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Prepare batch update data
      const locationHashes = [
        "QmLocation1Hash",
        "QmLocation2Hash",
        "QmLocation3Hash"
      ];
      const timestamps = [
        now - 300,
        now - 200,
        now - 100
      ];
      const batteryLevels = [90, 85, 80];
      
      // Send batch update
      await deliveryTracker.connect(hauler).batchUpdateLocations(
        jobId,
        locationHashes,
        timestamps,
        batteryLevels
      );
      
      // Check location count
      const locationCount = await deliveryTracker.getLocationUpdateCount(jobId);
      expect(locationCount).to.equal(4); // Initial + 3 batch updates
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update HaulHub address", async function () {
      await deliveryTracker.connect(owner).updateHaulHub(addr3.address);
      expect(await deliveryTracker.haulHub()).to.equal(addr3.address);
    });

    it("Should allow owner to update verifier address", async function () {
      await deliveryTracker.connect(owner).updateVerifier(addr3.address);
      expect(await deliveryTracker.verifier()).to.equal(addr3.address);
    });

    it("Should allow owner to override delivery status", async function () {
      // Start delivery
      await deliveryTracker.connect(hauler).startDelivery(jobId, initialLocationHash);
      
      // Override status
      await deliveryTracker.connect(owner).overrideDeliveryStatus(
        jobId,
        4, // Delivered
        "Admin override due to system error"
      );
      
      // Check status
      const status = await deliveryTracker.currentStatus(jobId);
      expect(status).to.equal(4); // Delivered status is 4
    });

    it("Should not allow non-owner to override status", async function () {
      await expect(
        deliveryTracker.connect(addr3).overrideDeliveryStatus(
          jobId,
          4,
          "Unauthorized override attempt"
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});