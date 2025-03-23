// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HaulHub
 * @dev Main contract for the HaulHub platform
 * Handles job creation, payments, and escrow
 */
contract HaulHub is Ownable, ReentrancyGuard {
    // Job statuses
    enum JobStatus { Created, Accepted, InTransit, Completed, Cancelled, Disputed }
    
    // Job structure
    struct Job {
        uint256 id;
        address poster;
        address hauler;
        uint256 payment;
        uint256 tip;
        uint256 fee;
        uint256 createdAt;
        uint256 acceptedAt;
        uint256 completedAt;
        JobStatus status;
        bool isRush;
        string locationHash; // IPFS hash for location details (for privacy)
    }
    
    // Events
    event JobCreated(uint256 indexed jobId, address indexed poster, uint256 payment, bool isRush);
    event JobAccepted(uint256 indexed jobId, address indexed hauler, uint256 acceptedAt);
    event JobInTransit(uint256 indexed jobId, address indexed hauler);
    event JobCompleted(uint256 indexed jobId, address indexed hauler, address indexed poster, uint256 completedAt);
    event JobCancelled(uint256 indexed jobId, address indexed canceller);
    event JobDisputed(uint256 indexed jobId, address indexed disputer);
    event PaymentReleased(uint256 indexed jobId, address indexed recipient, uint256 amount);
    event TipAdded(uint256 indexed jobId, address indexed tipper, uint256 amount);
    
    // State variables
    uint256 public nextJobId = 1;
    uint256 public platformFeePercent = 5; // 5% platform fee
    address public feeCollector;
    
    // Storage
    mapping(uint256 => Job) public jobs;
    mapping(address => uint256[]) public posterJobs;
    mapping(address => uint256[]) public haulerJobs;
    
    constructor(address _feeCollector) {
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Create a new job
     * @param _locationHash IPFS hash for location details
     * @param _isRush Whether this is a rush job
     */
    function createJob(string memory _locationHash, bool _isRush) external payable nonReentrant {
        require(msg.value > 0, "Payment must be greater than 0");
        
        uint256 fee = (msg.value * platformFeePercent) / 100;
        uint256 payment = msg.value - fee;
        
        Job memory newJob = Job({
            id: nextJobId,
            poster: msg.sender,
            hauler: address(0),
            payment: payment,
            tip: 0,
            fee: fee,
            createdAt: block.timestamp,
            acceptedAt: 0,
            completedAt: 0,
            status: JobStatus.Created,
            isRush: _isRush,
            locationHash: _locationHash
        });
        
        jobs[nextJobId] = newJob;
        posterJobs[msg.sender].push(nextJobId);
        
        emit JobCreated(nextJobId, msg.sender, payment, _isRush);
        
        nextJobId++;
    }
    
    /**
     * @dev Accept a job
     * @param _jobId ID of the job to accept
     */
    function acceptJob(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        
        require(job.id > 0, "Job does not exist");
        require(job.status == JobStatus.Created, "Job is not available");
        require(job.poster != msg.sender, "Cannot accept your own job");
        
        job.hauler = msg.sender;
        job.status = JobStatus.Accepted;
        job.acceptedAt = block.timestamp;
        
        haulerJobs[msg.sender].push(_jobId);
        
        emit JobAccepted(_jobId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Mark job as in transit
     * @param _jobId ID of the job
     */
    function startTransit(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        
        require(job.id > 0, "Job does not exist");
        require(job.status == JobStatus.Accepted, "Job must be accepted first");
        require(job.hauler == msg.sender, "Only the hauler can start transit");
        
        job.status = JobStatus.InTransit;
        
        emit JobInTransit(_jobId, msg.sender);
    }
    
    /**
     * @dev Complete a job
     * @param _jobId ID of the job to complete
     */
    function completeJob(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        
        require(job.id > 0, "Job does not exist");
        require(job.status == JobStatus.InTransit, "Job must be in transit");
        require(job.hauler == msg.sender, "Only the hauler can complete the job");
        
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        
        // Release payment to hauler
        uint256 totalPayment = job.payment + job.tip;
        payable(job.hauler).transfer(totalPayment);
        
        // Transfer fee to fee collector
        payable(feeCollector).transfer(job.fee);
        
        emit JobCompleted(_jobId, job.hauler, job.poster, block.timestamp);
        emit PaymentReleased(_jobId, job.hauler, totalPayment);
    }
    
    /**
     * @dev Cancel a job
     * @param _jobId ID of the job to cancel
     */
    function cancelJob(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        
        require(job.id > 0, "Job does not exist");
        require(job.status == JobStatus.Created || job.status == JobStatus.Accepted, "Job cannot be cancelled");
        require(job.poster == msg.sender || job.hauler == msg.sender, "Only poster or hauler can cancel");
        
        job.status = JobStatus.Cancelled;
        
        // If cancelled by poster before acceptance or by hauler after acceptance,
        // refund the payment to the poster
        if ((job.poster == msg.sender && job.hauler == address(0)) || 
            (job.hauler == msg.sender && job.status == JobStatus.Accepted)) {
            payable(job.poster).transfer(job.payment + job.tip);
            
            // Return fee as well if cancelled before hauler accepts
            if (job.hauler == address(0)) {
                payable(job.poster).transfer(job.fee);
            } else {
                // If hauler cancels, fee still goes to platform
                payable(feeCollector).transfer(job.fee);
            }
        }
        
        emit JobCancelled(_jobId, msg.sender);
    }
    
    /**
     * @dev Add a tip to a job
     * @param _jobId ID of the job to tip
     */
    function addTip(uint256 _jobId) external payable nonReentrant {
        Job storage job = jobs[_jobId];
        
        require(job.id > 0, "Job does not exist");
        require(job.status != JobStatus.Cancelled && job.status != JobStatus.Disputed, "Cannot tip a cancelled or disputed job");
        require(msg.value > 0, "Tip must be greater than 0");
        
        job.tip += msg.value;
        
        emit TipAdded(_jobId, msg.sender, msg.value);
    }
    
    /**
     * @dev Mark a job as disputed
     * @param _jobId ID of the job to dispute
     */
    function disputeJob(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        
        require(job.id > 0, "Job does not exist");
        require(job.status != JobStatus.Cancelled && job.status != JobStatus.Disputed, "Job already cancelled or disputed");
        require(job.poster == msg.sender || job.hauler == msg.sender, "Only poster or hauler can dispute");
        
        job.status = JobStatus.Disputed;
        
        emit JobDisputed(_jobId, msg.sender);
    }
    
    /**
     * @dev Resolve a disputed job (only callable by owner)
     * @param _jobId ID of the disputed job
     * @param _resolveForPoster Whether to resolve in favor of poster
     */
    function resolveDispute(uint256 _jobId, bool _resolveForPoster) external onlyOwner nonReentrant {
        Job storage job = jobs[_jobId];
        
        require(job.id > 0, "Job does not exist");
        require(job.status == JobStatus.Disputed, "Job must be disputed");
        
        if (_resolveForPoster) {
            // Refund to poster
            payable(job.poster).transfer(job.payment + job.tip);
            payable(feeCollector).transfer(job.fee);
        } else {
            // Pay hauler
            payable(job.hauler).transfer(job.payment + job.tip);
            payable(feeCollector).transfer(job.fee);
        }
        
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        
        emit JobCompleted(_jobId, job.hauler, job.poster, block.timestamp);
    }
    
    /**
     * @dev Update platform fee percentage (only callable by owner)
     * @param _feePercent New fee percentage
     */
    function updatePlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 20, "Fee cannot exceed 20%");
        platformFeePercent = _feePercent;
    }
    
    /**
     * @dev Update fee collector address (only callable by owner)
     * @param _feeCollector New fee collector address
     */
    function updateFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Fee collector cannot be zero address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Get jobs posted by an address
     * @param _poster Address of the poster
     * @return Array of job IDs
     */
    function getPosterJobs(address _poster) external view returns (uint256[] memory) {
        return posterJobs[_poster];
    }
    
    /**
     * @dev Get jobs accepted by a hauler
     * @param _hauler Address of the hauler
     * @return Array of job IDs
     */
    function getHaulerJobs(address _hauler) external view returns (uint256[] memory) {
        return haulerJobs[_hauler];
    }
    
    /**
     * @dev Get job details
     * @param _jobId ID of the job
     * @return Full job details
     */
    function getJobDetails(uint256 _jobId) external view returns (Job memory) {
        require(jobs[_jobId].id > 0, "Job does not exist");
        return jobs[_jobId];
    }
}