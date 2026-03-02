const hre = require("hardhat");

async function main() {
  console.log("Deploying FoodTraceCheckpoint smart contract...");

  const FoodTraceCheckpoint = await hre.ethers.getContractFactory(
    "FoodTraceCheckpoint",
  );
  const contract = await FoodTraceCheckpoint.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`FoodTraceCheckpoint deployed to: ${contractAddress}`);

  // Save contract address to a file for frontend/backend use
  const fs = require("fs");
  const config = {
    contractAddress: contractAddress,
    network: "sepolia",
    chainId: 11155111,
    deploymentTime: new Date().toISOString(),
  };

  fs.writeFileSync("./contract-address.json", JSON.stringify(config, null, 2));

  console.log("Contract address saved to contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
