// Smart Contract ABI - FoodTraceCheckpoint
// This ABI matches the Solidity contract in smart-contract/contracts/FoodTraceCheckpoint.sol

const contractABI = [
  {
    inputs: [
      { internalType: "string", name: "_batchId", type: "string" },
      { internalType: "int256", name: "_latitude", type: "int256" },
      { internalType: "int256", name: "_longitude", type: "int256" },
      { internalType: "string", name: "_scannerRole", type: "string" },
      { internalType: "string", name: "_locationName", type: "string" },
    ],
    name: "recordCheckpoint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_batchId", type: "string" },
      { internalType: "uint256", name: "_index", type: "uint256" },
    ],
    name: "getCheckpoint",
    outputs: [
      { internalType: "string", name: "batchId", type: "string" },
      { internalType: "int256", name: "latitude", type: "int256" },
      { internalType: "int256", name: "longitude", type: "int256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "string", name: "scannerRole", type: "string" },
      { internalType: "string", name: "locationName", type: "string" },
      { internalType: "address", name: "recordedBy", type: "address" },
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_batchId", type: "string" }],
    name: "getCheckpoints",
    outputs: [
      {
        components: [
          { internalType: "string", name: "batchId", type: "string" },
          { internalType: "int256", name: "latitude", type: "int256" },
          { internalType: "int256", name: "longitude", type: "int256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "string", name: "scannerRole", type: "string" },
          { internalType: "string", name: "locationName", type: "string" },
          { internalType: "address", name: "recordedBy", type: "address" },
          { internalType: "uint256", name: "blockNumber", type: "uint256" },
        ],
        internalType: "struct FoodTraceCheckpoint.Checkpoint[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_batchId", type: "string" }],
    name: "getCheckpointCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "batchId",
        type: "string",
      },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "int256", name: "latitude", type: "int256" },
      { internalType: "int256", name: "longitude", type: "int256" },
      { internalType: "address", name: "recordedBy", type: "address" },
    ],
    name: "CheckpointRecorded",
    type: "event",
  },
];

// Contract address deployed on Sepolia
const CONTRACT_ADDRESS = "0xA4cC9b6e5bf1836F7aF7b2dC7A9eF3AC595C6Ecf";

module.exports = {
  contractABI,
  CONTRACT_ADDRESS,
};
