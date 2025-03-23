const hre = require("hardhat");

async function main() {
  // Get the contract factories
  const HaulHub = await hre.ethers.getContractFactory("HaulHub");
  const BadgeNFT = await hre.ethers.getContractFactory("BadgeNFT");
  const DeliveryTracker = await hre.ethers.getContractFactory("DeliveryTracker");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Deploy BadgeNFT
  console.log("Deploying BadgeNFT...");
  const badgeNFT = await BadgeNFT.deploy();
  await badgeNFT.deployed();
  console.log("BadgeNFT deployed to:", badgeNFT.address);
  
  // Deploy HaulHub with deployer as fee collector
  console.log("Deploying HaulHub...");
  const haulHub = await HaulHub.deploy(deployer.address);
  await haulHub.deployed();
  console.log("HaulHub deployed to:", haulHub.address);
  
  // Deploy DeliveryTracker with HaulHub address and deployer as verifier
  console.log("Deploying DeliveryTracker...");
  const deliveryTracker = await DeliveryTracker.deploy(haulHub.address, deployer.address);
  await deliveryTracker.deployed();
  console.log("DeliveryTracker deployed to:", deliveryTracker.address);
  
  // Add HaulHub as an approved issuer for badges
  console.log("Setting HaulHub as an approved badge issuer...");
  await badgeNFT.addIssuer(haulHub.address);
  console.log("HaulHub added as an approved issuer");
  
  console.log("Deployment complete!");
  
  // Output contract addresses for easy reference
  console.log("Contract Addresses:");
  console.log("HaulHub:", haulHub.address);
  console.log("BadgeNFT:", badgeNFT.address);
  console.log("DeliveryTracker:", deliveryTracker.address);
  
  // Export addresses to a file for easy access by the frontend and backend
  if (hre.network.name !== "hardhat") {
    const fs = require("fs");
    const contractAddresses = {
      haulHub: haulHub.address,
      badgeNFT: badgeNFT.address,
      deliveryTracker: deliveryTracker.address,
      network: hre.network.name
    };
    
    fs.writeFileSync(
      "deployedAddresses.json",
      JSON.stringify(contractAddresses, null, 2)
    );
    console.log("Contract addresses saved to deployedAddresses.json");
  }
  
  // Verify contracts on Etherscan (if on a public network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    
    // Wait for a few block confirmations
    await haulHub.deployTransaction.wait(5);
    await badgeNFT.deployTransaction.wait(5);
    await deliveryTracker.deployTransaction.wait(5);
    
    console.log("Verifying contracts on Etherscan...");
    
    // Verify HaulHub
    await hre.run("verify:verify", {
      address: haulHub.address,
      constructorArguments: [deployer.address],
    });
    
    // Verify BadgeNFT
    await hre.run("verify:verify", {
      address: badgeNFT.address,
      constructorArguments: [],
    });
    
    // Verify DeliveryTracker
    await hre.run("verify:verify", {
      address: deliveryTracker.address,
      constructorArguments: [haulHub.address, deployer.address],
    });
    
    console.log("Contracts verified!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });