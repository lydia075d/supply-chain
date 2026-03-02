// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FoodTraceCheckpoint {
    struct Checkpoint {
        string batchId;
        int256 latitude;
        int256 longitude;
        uint256 timestamp;
        string scannerRole;
        string locationName;
        address recordedBy;
        uint256 blockNumber;
    }
    
    // Mapping: batchId => array of checkpoints
    mapping(string => Checkpoint[]) private batchCheckpoints;
    
    // Events
    event CheckpointRecorded(
        string indexed batchId,
        uint256 timestamp,
        int256 latitude,
        int256 longitude,
        address recordedBy
    );
    
    // Record a new checkpoint for a batch
    function recordCheckpoint(
        string memory _batchId,
        int256 _latitude,
        int256 _longitude,
        string memory _scannerRole,
        string memory _locationName
    ) public {
        Checkpoint memory newCheckpoint = Checkpoint({
            batchId: _batchId,
            latitude: _latitude,
            longitude: _longitude,
            timestamp: block.timestamp,
            scannerRole: _scannerRole,
            locationName: _locationName,
            recordedBy: msg.sender,
            blockNumber: block.number
        });
        
        batchCheckpoints[_batchId].push(newCheckpoint);
        
        emit CheckpointRecorded(_batchId, block.timestamp, _latitude, _longitude, msg.sender);
    }
    
    // Get all checkpoints for a batch
    function getCheckpoints(string memory _batchId) public view returns (Checkpoint[] memory) {
        return batchCheckpoints[_batchId];
    }
    
    // Get checkpoint count for a batch
    function getCheckpointCount(string memory _batchId) public view returns (uint256) {
        return batchCheckpoints[_batchId].length;
    }
    
    // Get a specific checkpoint
    function getCheckpoint(string memory _batchId, uint256 _index) public view returns (
        string memory batchId,
        int256 latitude,
        int256 longitude,
        uint256 timestamp,
        string memory scannerRole,
        string memory locationName,
        address recordedBy,
        uint256 blockNumber
    ) {
        Checkpoint storage cp = batchCheckpoints[_batchId][_index];
        return (
            cp.batchId,
            cp.latitude,
            cp.longitude,
            cp.timestamp,
            cp.scannerRole,
            cp.locationName,
            cp.recordedBy,
            cp.blockNumber
        );
    }
}
