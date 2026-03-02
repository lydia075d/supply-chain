const { Web3 } = require("web3");

// Sepolia RPC URL - user provided project ID
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  `https://sepolia.infura.io/v3/dc0c568084195cfe71a794f3442c8d3f`;

const web3 = new Web3(SEPOLIA_RPC_URL);

module.exports = web3;
