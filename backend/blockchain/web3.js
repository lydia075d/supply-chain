const { Web3 } = require("web3");

// Sepolia RPC URL - user provided project ID
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;

const web3 = new Web3(SEPOLIA_RPC_URL);

module.exports = web3;
