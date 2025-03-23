const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HaulHub", function () {
  let HaulHub;
  let haulHub;
  let owner;
  let poster;
  let hauler;
  let addr3;
  let feeCollector;
  let jobId;
  let jobPayment = ethers.utils.parseEther("0.1"); // 0.1 ETH

  beforeEach(async function () {
    // Get contract factory
    HaulHub = await ethers.getContractFactory("HaulHub");
    
    // Get signers
    [owner, poster, hauler, addr3, feeCollector] = await ethers.getSigners();
    
    // Deploy contract with fee collector
    haulHub = await HaulHub.deploy(feeCollector.address);
    await haulHub.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await haulHub.owner()).to.equal(owner.address);
    });

    it("Should set the right fee collector", async function () {
      expect(await haulHub.feeCollector()).to.equal(feeCollector.address);
    });

    it("Should set the initial platform fee percentage", async function () {
      expect(await haulHub.platformFeePercent()).to.equal(5);
    });
  });

  describe("Job Management", function () {
    beforeEach(async function () {
      // Create a job
      const locationHash = "QmTestLocationHash";
      const isRush = false;
      
      const tx = await haulHub.connect(poster).createJob(locationHash, isRush, { value: jobPayment });
      const receipt = await tx.wait();
      
      // Get job ID from event
      const event = receipt.events.find(e => e.event === 'JobCreated');
      jobId = event.args.jobId;
    });

    it("Should create a job with correct details", async function () {
      const job = await haulHub.jobs(jobId);
      
      expect(job.poster).to.equal(poster.address);
      expect(job.hauler).to.equal(ethers.constants.AddressZero);
      expect(job.status).to.equal(0); // JobStatus.Created
      expect(job.isRush).to.equal(false);
      
      // Check payment split
      const expectedFee = jobPayment.mul(5).div(100);
      const expectedPayment = jobPayment.sub(expectedFee);
      
      expect(job.payment).to.equal(expectedPayment);
      expect(job.fee).to.equal(expectedFee);
    });

    it("Should allow a hauler to accept a job", async function () {
      await haulHub.connect(hauler).acceptJob(jobId);
      
      const job = await haulHub.jobs(jobId);
      expect(job.hauler).to.equal(hauler.address);
      expect(job.status).to.equal(1); // JobStatus.Accepted
      expect(job.acceptedAt).to.not.equal(0);
    });

    it("Should not allow the poster to accept their own job", async function () {
      await expect(
        haulHub.connect(poster).acceptJob(jobId)
      ).to.be.revertedWith("Cannot accept your own job");
    });

    it("Should allow hauler to mark job in transit", async function () {
      await haulHub.connect(hauler).acceptJob(jobId);
      await haulHub.connect(hauler).startTransit(jobId);
      
      const job = await haulHub.jobs(jobId);
      expect(job.status).to.equal(2); // JobStatus.InTransit
    });

    it("Should allow hauler to complete a job", async function () {
      await haulHub.connect(hauler).acceptJob(jobId);
      await haulHub.connect(hauler).startTransit(jobId);
      
      // Get balances before completion
      const haulerBalanceBefore = await ethers.provider.getBalance(hauler.address);
      const feeCollectorBalanceBefore = await ethers.provider.getBalance(feeCollector.address);
      
      // Complete the job
      const tx = await haulHub.connect(hauler).completeJob(jobId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Check status
      const job = await haulHub.jobs(jobId);
      expect(job.status).to.equal(3); // JobStatus.Completed
      expect(job.completedAt).to.not.equal(0);
      
      // Check payment transfer
      const haulerBalanceAfter = await ethers.provider.getBalance(hauler.address);
      const feeCollectorBalanceAfter = await ethers.provider.getBalance(feeCollector.address);
      
      // Hauler should receive payment minus gas
      expect(haulerBalanceAfter).to.equal(
        haulerBalanceBefore.add(job.payment).sub(gasUsed)
      );
      
      // Fee collector should receive fee
      expect(feeCollectorBalanceAfter).to.equal(
        feeCollectorBalanceBefore.add(job.fee)
      );
    });

    it("Should allow adding a tip to a job", async function () {
      const tipAmount = ethers.utils.parseEther("0.02");
      
      await haulHub.connect(addr3).addTip(jobId, { value: tipAmount });
      
      const job = await haulHub.jobs(jobId);
      expect(job.tip).to.equal(tipAmount);
    });

    it("Should allow poster to cancel a job before acceptance", async function () {
      // Get balance before
      const posterBalanceBefore = await ethers.provider.getBalance(poster.address);
      
      // Cancel the job
      const tx = await haulHub.connect(poster).cancelJob(jobId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Check status
      const job = await haulHub.jobs(jobId);
      expect(job.status).to.equal(4); // JobStatus.Cancelled
      
      // Check refund (full amount including fee)
      const posterBalanceAfter = await ethers.provider.getBalance(poster.address);
      expect(posterBalanceAfter).to.equal(
        posterBalanceBefore.add(job.payment).add(job.fee).sub(gasUsed)
      );
    });

    it("Should handle disputes", async function () {
      await haulHub.connect(hauler).acceptJob(jobId);
      await haulHub.connect(hauler).startTransit(jobId);
      
      // Create dispute
      await haulHub.connect(hauler).disputeJob(jobId);
      
      const job = await haulHub.jobs(jobId);
      expect(job.status).to.equal(5); // JobStatus.Disputed
      
      // Get balances before resolution
      const haulerBalanceBefore = await ethers.provider.getBalance(hauler.address);
      const feeCollectorBalanceBefore = await ethers.provider.getBalance(feeCollector.address);
      
      // Resolve in favor of hauler
      await haulHub.connect(owner).resolveDispute(jobId, false);
      
      // Check status
      const resolvedJob = await haulHub.jobs(jobId);
      expect(resolvedJob.status).to.equal(3); // JobStatus.Completed
      
      // Check payment transfer
      const haulerBalanceAfter = await ethers.provider.getBalance(hauler.address);
      const feeCollectorBalanceAfter = await ethers.provider.getBalance(feeCollector.address);
      
      // Hauler should receive payment
      expect(haulerBalanceAfter).to.equal(
        haulerBalanceBefore.add(job.payment)
      );
      
      // Fee collector should receive fee
      expect(feeCollectorBalanceAfter).to.equal(
        feeCollectorBalanceBefore.add(job.fee)
      );
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await haulHub.connect(owner).updatePlatformFee(7);
      expect(await haulHub.platformFeePercent()).to.equal(7);
    });

    it("Should not allow setting fee higher than 20%", async function () {
      await expect(
        haulHub.connect(owner).updatePlatformFee(21)
      ).to.be.revertedWith("Fee cannot exceed 20%");
    });

    it("Should allow owner to update fee collector", async function () {
      await haulHub.connect(owner).updateFeeCollector(addr3.address);
      expect(await haulHub.feeCollector()).to.equal(addr3.address);
    });

    it("Should not allow non-owner to update fee collector", async function () {
      await expect(
        haulHub.connect(addr3).updateFeeCollector(addr3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Create jobs
      const locationHash = "QmTestLocationHash";
      const isRush = false;
      
      // Create 2 jobs from poster
      await haulHub.connect(poster).createJob(locationHash, isRush, { value: jobPayment });
      await haulHub.connect(poster).createJob(locationHash, isRush, { value: jobPayment });
      
      // Accept one job by hauler
      await haulHub.connect(hauler).acceptJob(1);
    });

    it("Should correctly return poster jobs", async function () {
      const posterJobs = await haulHub.getPosterJobs(poster.address);
      expect(posterJobs.length).to.equal(2);
      expect(posterJobs[0]).to.equal(1);
      expect(posterJobs[1]).to.equal(2);
    });

    it("Should correctly return hauler jobs", async function () {
      const haulerJobs = await haulHub.getHaulerJobs(hauler.address);
      expect(haulerJobs.length).to.equal(1);
      expect(haulerJobs[0]).to.equal(1);
    });

    it("Should return correct job details", async function () {
      const job = await haulHub.getJobDetails(1);
      expect(job.id).to.equal(1);
      expect(job.poster).to.equal(poster.address);
      expect(job.hauler).to.equal(hauler.address);
      expect(job.status).to.equal(1); // JobStatus.Accepted
    });
  });
});