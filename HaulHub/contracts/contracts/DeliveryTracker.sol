// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IHaulHub {
    function getJobDetails(uint256 _jobId) external view returns (
        uint256 id,
        address poster,
        address hauler,
        uint256 payment,
        uint256 tip,
        uint256 fee,
        uint256 createdAt,
        uint256 acceptedAt,
        uint256 completedAt,
        uint8 status,
        bool isRush,
        string memory locationHash
    );
    
    function startTransit(uint256 _jobId) external;
    function completeJob(uint256 _jobId) external;
}

contract DeliveryTracker is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Status for delivery milestones
    enum DeliveryStatus {
        NotStarted,
        PickupConfirmed,
        InTransit,
        AtDropoff,
        Delivered,
        Failed
    }
    
    // Delivery milestone events
    struct DeliveryMilestone {
        uint256 timestamp;
        string locationHash; // IPFS hash of encrypted location data
        string proofHash;    // IPFS hash of proof (photo, signature, etc.)
        DeliveryStatus status;
        string notes;
    }
    
    // Location update structure
    struct LocationUpdate {
        uint256 timestamp;
        string locationHash; // IPFS hash of encrypted location data
        uint256 batteryLevel; // Device battery percentage (0-100)
        string notes;
    }
    
    // Events
    event DeliveryStarted(uint256 indexed jobId, address indexed hauler, uint256 timestamp);
    event PickupConfirmed(uint256 indexed jobId, address indexed hauler, string proofHash);
    event LocationUpdated(uint256 indexed jobId, address indexed hauler, string locationHash);
    event DeliveryMilestoneReached(uint256 indexed jobId, DeliveryStatus status, string proofHash);
    event DeliveryCompleted(uint256 indexed jobId, address indexed hauler, string proofHash);
    event DeliveryFailed(uint256 indexed jobId, address indexed hauler, string reason);
    
    // State variables
    IHaulHub public haulHub;
    address public verifier;
    
    // Storage
    mapping(uint256 => DeliveryMilestone[]) public deliveryMilestones;
    mapping(uint256 => LocationUpdate[]) public locationUpdates;
    mapping(uint256 => DeliveryStatus) public currentStatus;
    mapping(uint256 => mapping(string => bool)) public usedProofs; // Prevent proof reuse
    
    // Modifier to ensure caller is the hauler for a job
    modifier onlyJobHauler(uint256 _jobId) {
        (, , address hauler, , , , , , , , ,) = haulHub.getJobDetails(_jobId);
        require(hauler == msg.sender, "Caller is not the job hauler");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _haulHubAddress Address of the main HaulHub contract
     * @param _verifier Address that can verify off-chain data
     */
    constructor(address _haulHubAddress, address _verifier) {
        haulHub = IHaulHub(_haulHubAddress);
        verifier = _verifier;
    }
    
    /**
     * @dev Start tracking delivery for a job
     * @param _jobId ID of the job
     * @param _initialLocationHash IPFS hash of initial encrypted location
     */
    function startDelivery(uint256 _jobId, string memory _initialLocationHash) external onlyJobHauler(_jobId) {
        require(currentStatus[_jobId] == DeliveryStatus.NotStarted, "Delivery already started");
        
        // Set initial status
        currentStatus[_jobId] = DeliveryStatus.InTransit;
        
        // Record initial location
        LocationUpdate memory initialLocation = LocationUpdate({
            timestamp: block.timestamp,
            locationHash: _initialLocationHash,
            batteryLevel: 100, // Assume full battery at start
            notes: "Delivery started"
        });
        
        locationUpdates[_jobId].push(initialLocation);
        
        // Call HaulHub to mark job as in transit
        try haulHub.startTransit(_jobId) {
            // Successfully started transit in main contract
        } catch {
            // Continue anyway, we'll track locally
        }
        
        emit DeliveryStarted(_jobId, msg.sender, block.timestamp);
        emit LocationUpdated(_jobId, msg.sender, _initialLocationHash);
    }
    
    /**
     * @dev Confirm pickup with proof
     * @param _jobId ID of the job
     * @param _locationHash IPFS hash of encrypted location data
     * @param _proofHash IPFS hash of pickup proof (photo, signature, etc.)
     * @param _notes Optional notes about the pickup
     */
    function confirmPickup(
        uint256 _jobId,
        string memory _locationHash,
        string memory _proofHash,
        string memory _notes
    ) external onlyJobHauler(_jobId) {
        require(currentStatus[_jobId] == DeliveryStatus.InTransit, "Delivery not in transit");
        require(!usedProofs[_jobId][_proofHash], "Proof hash already used");
        
        // Update status
        currentStatus[_jobId] = DeliveryStatus.PickupConfirmed;
        
        // Record milestone
        DeliveryMilestone memory milestone = DeliveryMilestone({
            timestamp: block.timestamp,
            locationHash: _locationHash,
            proofHash: _proofHash,
            status: DeliveryStatus.PickupConfirmed,
            notes: _notes
        });
        
        deliveryMilestones[_jobId].push(milestone);
        usedProofs[_jobId][_proofHash] = true;
        
        emit PickupConfirmed(_jobId, msg.sender, _proofHash);
        emit DeliveryMilestoneReached(_jobId, DeliveryStatus.PickupConfirmed, _proofHash);
    }
    
    /**
     * @dev Update location during delivery
     * @param _jobId ID of the job
     * @param _locationHash IPFS hash of encrypted location data
     * @param _batteryLevel Device battery percentage (0-100)
     * @param _notes Optional notes about the location
     */
    function updateLocation(
        uint256 _jobId,
        string memory _locationHash,
        uint256 _batteryLevel,
        string memory _notes
    ) external onlyJobHauler(_jobId) {
        require(
            currentStatus[_jobId] == DeliveryStatus.InTransit || 
            currentStatus[_jobId] == DeliveryStatus.PickupConfirmed,
            "Delivery not active"
        );
        
        require(_batteryLevel <= 100, "Invalid battery level");
        
        // Record location update
        LocationUpdate memory update = LocationUpdate({
            timestamp: block.timestamp,
            locationHash: _locationHash,
            batteryLevel: _batteryLevel,
            notes: _notes
        });
        
        locationUpdates[_jobId].push(update);
        
        emit LocationUpdated(_jobId, msg.sender, _locationHash);
    }
    
    /**
     * @dev Mark arrival at dropoff location
     * @param _jobId ID of the job
     * @param _locationHash IPFS hash of encrypted location data
     * @param _proofHash IPFS hash of arrival proof (photo, etc.)
     * @param _notes Optional notes about the arrival
     */
    function arriveAtDropoff(
        uint256 _jobId,
        string memory _locationHash,
        string memory _proofHash,
        string memory _notes
    ) external onlyJobHauler(_jobId) {
        require(
            currentStatus[_jobId] == DeliveryStatus.InTransit || 
            currentStatus[_jobId] == DeliveryStatus.PickupConfirmed,
            "Delivery not active"
        );
        require(!usedProofs[_jobId][_proofHash], "Proof hash already used");
        
        // Update status
        currentStatus[_jobId] = DeliveryStatus.AtDropoff;
        
        // Record milestone
        DeliveryMilestone memory milestone = DeliveryMilestone({
            timestamp: block.timestamp,
            locationHash: _locationHash,
            proofHash: _proofHash,
            status: DeliveryStatus.AtDropoff,
            notes: _notes
        });
        
        deliveryMilestones[_jobId].push(milestone);
        usedProofs[_jobId][_proofHash] = true;
        
        emit DeliveryMilestoneReached(_jobId, DeliveryStatus.AtDropoff, _proofHash);
    }
    
    /**
     * @dev Complete delivery with proof
     * @param _jobId ID of the job
     * @param _locationHash IPFS hash of encrypted location data
     * @param _proofHash IPFS hash of delivery proof (photo, signature, etc.)
     * @param _notes Optional notes about the delivery
     */
    function completeDelivery(
        uint256 _jobId,
        string memory _locationHash,
        string memory _proofHash,
        string memory _notes
    ) external onlyJobHauler(_jobId) {
        require(
            currentStatus[_jobId] == DeliveryStatus.AtDropoff || 
            currentStatus[_jobId] == DeliveryStatus.PickupConfirmed ||
            currentStatus[_jobId] == DeliveryStatus.InTransit,
            "Delivery not in a completable state"
        );
        require(!usedProofs[_jobId][_proofHash], "Proof hash already used");
        
        // Update status
        currentStatus[_jobId] = DeliveryStatus.Delivered;
        
        // Record milestone
        DeliveryMilestone memory milestone = DeliveryMilestone({
            timestamp: block.timestamp,
            locationHash: _locationHash,
            proofHash: _proofHash,
            status: DeliveryStatus.Delivered,
            notes: _notes
        });
        
        deliveryMilestones[_jobId].push(milestone);
        usedProofs[_jobId][_proofHash] = true;
        
        // Call HaulHub to complete the job
        try haulHub.completeJob(_jobId) {
            // Successfully completed job in main contract
        } catch {
            // Continue anyway, we've recorded proof locally
        }
        
        emit DeliveryCompleted(_jobId, msg.sender, _proofHash);
        emit DeliveryMilestoneReached(_jobId, DeliveryStatus.Delivered, _proofHash);
    }
    
    /**
     * @dev Report a failed delivery
     * @param _jobId ID of the job
     * @param _locationHash IPFS hash of encrypted location data
     * @param _proofHash IPFS hash of failure proof (photo, etc.)
     * @param _reason Reason for failure
     */
    function reportFailedDelivery(
        uint256 _jobId,
        string memory _locationHash,
        string memory _proofHash,
        string memory _reason
    ) external onlyJobHauler(_jobId) {
        require(
            currentStatus[_jobId] != DeliveryStatus.Delivered && 
            currentStatus[_jobId] != DeliveryStatus.Failed && 
            currentStatus[_jobId] != DeliveryStatus.NotStarted,
            "Delivery in invalid state for failure reporting"
        );
        require(!usedProofs[_jobId][_proofHash], "Proof hash already used");
        
        // Update status
        currentStatus[_jobId] = DeliveryStatus.Failed;
        
        // Record milestone
        DeliveryMilestone memory milestone = DeliveryMilestone({
            timestamp: block.timestamp,
            locationHash: _locationHash,
            proofHash: _proofHash,
            status: DeliveryStatus.Failed,
            notes: _reason
        });
        
        deliveryMilestones[_jobId].push(milestone);
        usedProofs[_jobId][_proofHash] = true;
        
        emit DeliveryFailed(_jobId, msg.sender, _reason);
        emit DeliveryMilestoneReached(_jobId, DeliveryStatus.Failed, _proofHash);
    }
    
    /**
     * @dev Batch update locations (gas efficient)
     * @param _jobId ID of the job
     * @param _locationHashes Array of IPFS hashes for location data
     * @param _timestamps Array of timestamps for each location
     * @param _batteryLevels Array of battery levels
     */
    function batchUpdateLocations(
        uint256 _jobId,
        string[] memory _locationHashes,
        uint256[] memory _timestamps,
        uint256[] memory _batteryLevels
    ) external onlyJobHauler(_jobId) {
        require(
            currentStatus[_jobId] == DeliveryStatus.InTransit || 
            currentStatus[_jobId] == DeliveryStatus.PickupConfirmed,
            "Delivery not active"
        );
        
        require(
            _locationHashes.length == _timestamps.length && 
            _timestamps.length == _batteryLevels.length,
            "Array lengths must match"
        );
        
        require(_locationHashes.length <= 20, "Too many updates in one batch");
        
        for (uint256 i = 0; i < _locationHashes.length; i++) {
            require(_batteryLevels[i] <= 100, "Invalid battery level");
            require(_timestamps[i] <= block.timestamp, "Future timestamp not allowed");
            
            // Record location update
            LocationUpdate memory update = LocationUpdate({
                timestamp: _timestamps[i],
                locationHash: _locationHashes[i],
                batteryLevel: _batteryLevels[i],
                notes: ""
            });
            
            locationUpdates[_jobId].push(update);
            
            emit LocationUpdated(_jobId, msg.sender, _locationHashes[i]);
        }
    }
    
    /**
     * @dev Get delivery milestone count for a job
     * @param _jobId ID of the job
     * @return Number of milestones
     */
    function getMilestoneCount(uint256 _jobId) external view returns (uint256) {
        return deliveryMilestones[_jobId].length;
    }
    
    /**
     * @dev Get location update count for a job
     * @param _jobId ID of the job
     * @return Number of location updates
     */
    function getLocationUpdateCount(uint256 _jobId) external view returns (uint256) {
        return locationUpdates[_jobId].length;
    }
    
    /**
     * @dev Get the current status of a delivery
     * @param _jobId ID of the job
     * @return Current delivery status
     */
    function getDeliveryStatus(uint256 _jobId) external view returns (DeliveryStatus) {
        return currentStatus[_jobId];
    }
    
    /**
     * @dev Verify a signed proof message (for off-chain validation)
     * @param _message Original message that was signed
     * @param _signature Signature to verify
     * @return True if signature is valid and from the verifier
     */
    function verifySignedProof(bytes memory _message, bytes memory _signature) public view returns (bool) {
        bytes32 messageHash = keccak256(_message);
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        address recoveredSigner = ethSignedMessageHash.recover(_signature);
        return recoveredSigner == verifier;
    }
    
    /**
     * @dev Update the HaulHub contract address (only owner)
     * @param _newHaulHub New HaulHub contract address
     */
    function updateHaulHub(address _newHaulHub) external onlyOwner {
        require(_newHaulHub != address(0), "New address cannot be zero");
        haulHub = IHaulHub(_newHaulHub);
    }
    
    /**
     * @dev Update the verifier address (only owner)
     * @param _newVerifier New verifier address
     */
    function updateVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "New verifier cannot be zero");
        verifier = _newVerifier;
    }
    
    /**
     * @dev Override a delivery status in case of disputes (only owner)
     * @param _jobId ID of the job
     * @param _newStatus New delivery status
     * @param _notes Notes about the status override
     */
    function overrideDeliveryStatus(
        uint256 _jobId,
        DeliveryStatus _newStatus,
        string memory _notes
    ) external onlyOwner {
        // Record milestone for the override
        DeliveryMilestone memory milestone = DeliveryMilestone({
            timestamp: block.timestamp,
            locationHash: "",
            proofHash: "",
            status: _newStatus,
            notes: string(abi.encodePacked("ADMIN OVERRIDE: ", _notes))
        });
        
        deliveryMilestones[_jobId].push(milestone);
        currentStatus[_jobId] = _newStatus;
        
        emit DeliveryMilestoneReached(_jobId, _newStatus, "admin-override");
    }
}
