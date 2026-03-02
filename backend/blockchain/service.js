const web3 = require("./web3");
const { contractABI, CONTRACT_ADDRESS } = require("./contractABI");

// Create contract instance
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

/**
 * Record a checkpoint to the blockchain
 * @param {string} batchId - The batch identifier
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} scannerRole - Role of the scanner (distributor, etc.)
 * @param {string} locationName - Name/description of the location
 * @param {string} privateKey - Private key of the account to sign the transaction
 * @returns {object} Transaction receipt
 */
async function recordCheckpointToBlockchain(
  batchId,
  latitude,
  longitude,
  scannerRole,
  locationName,
  privateKey,
) {
  try {
    // Convert coordinates to integers (multiply by 1000000 for 6 decimal precision)
    const latInt = Math.round(latitude * 1000000);
    const lngInt = Math.round(longitude * 1000000);

    // Get account from private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    // Get nonce
    const nonce = await web3.eth.getTransactionCount(account.address);

    // Get gas price
    const gasPrice = await web3.eth.getGasPrice();

    // Build transaction
    const tx = {
      from: account.address,
      to: CONTRACT_ADDRESS,
      gas: 300000,
      gasPrice: gasPrice,
      nonce: nonce,
      data: contract.methods
        .recordCheckpoint(batchId, latInt, lngInt, scannerRole, locationName)
        .encodeABI(),
    };

    // Sign and send transaction
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction,
    );

    console.log(`[Blockchain] Checkpoint recorded for batch ${batchId}`);
    console.log(`[Blockchain] Transaction hash: ${receipt.transactionHash}`);
    console.log(`[Blockchain] Block number: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("[Blockchain] Error recording checkpoint:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all checkpoints for a batch from blockchain
 * @param {string} batchId - The batch identifier
 * @returns {array} Array of checkpoint data
 */
async function getCheckpointsFromBlockchain(batchId) {
  try {
    const checkpoints = await contract.methods.getCheckpoints(batchId).call();

    // Format the checkpoints
    const formattedCheckpoints = checkpoints.map((cp, index) => ({
      index: index,
      batchId: cp.batchId,
      latitude: Number(cp.latitude) / 1000000,
      longitude: Number(cp.longitude) / 1000000,
      timestamp: new Date(Number(cp.timestamp) * 1000).toISOString(),
      timestampUnix: Number(cp.timestamp),
      scannerRole: cp.scannerRole,
      locationName: cp.locationName,
      recordedBy: cp.recordedBy,
      blockNumber: Number(cp.blockNumber),
    }));

    return {
      success: true,
      checkpoints: formattedCheckpoints,
      count: formattedCheckpoints.length,
    };
  } catch (error) {
    console.error("[Blockchain] Error getting checkpoints:", error.message);
    return {
      success: false,
      error: error.message,
      checkpoints: [],
    };
  }
}

/**
 * Get checkpoint count for a batch
 * @param {string} batchId - The batch identifier
 * @returns {number} Number of checkpoints
 */
async function getCheckpointCountFromBlockchain(batchId) {
  try {
    const count = await contract.methods.getCheckpointCount(batchId).call();
    return {
      success: true,
      count: Number(count),
    };
  } catch (error) {
    console.error(
      "[Blockchain] Error getting checkpoint count:",
      error.message,
    );
    return {
      success: false,
      error: error.message,
      count: 0,
    };
  }
}

/**
 * Verify if a checkpoint exists on blockchain
 * @param {string} batchId - The batch identifier
 * @param {number} index - Checkpoint index
 * @returns {object} Checkpoint data if exists
 */
async function getCheckpointByIndex(batchId, index) {
  try {
    const cp = await contract.methods.getCheckpoint(batchId, index).call();

    return {
      success: true,
      checkpoint: {
        batchId: cp.batchId,
        latitude: Number(cp.latitude) / 1000000,
        longitude: Number(cp.longitude) / 1000000,
        timestamp: new Date(Number(cp.timestamp) * 1000).toISOString(),
        timestampUnix: Number(cp.timestamp),
        scannerRole: cp.scannerRole,
        locationName: cp.locationName,
        recordedBy: cp.recordedBy,
        blockNumber: Number(cp.blockNumber),
      },
    };
  } catch (error) {
    console.error(
      "[Blockchain] Error getting checkpoint by index:",
      error.message,
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  recordCheckpointToBlockchain,
  getCheckpointsFromBlockchain,
  getCheckpointCountFromBlockchain,
  getCheckpointByIndex,
  contract,
  web3,
};
