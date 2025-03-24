const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Exporting contract ABIs to client...');
  
  // Define paths
  const contractNames = ['HaulHub', 'BadgeNFT', 'DeliveryTracker'];
  const artifactsDir = path.resolve(__dirname, '../artifacts/contracts');
  const abiDir = path.resolve(__dirname, '../abis');
  const clientAbiDir = path.resolve(__dirname, '../../client/src/contracts');
  
  // Create directories if they don't exist
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  if (!fs.existsSync(clientAbiDir)) {
    fs.mkdirSync(clientAbiDir, { recursive: true });
  }
  
  // Process each contract
  for (const contractName of contractNames) {
    try {
      // Path to the contract artifact JSON (from hardhat compilation)
      const artifactPath = path.join(artifactsDir, `${contractName}.sol/${contractName}.json`);
      
      // Check if artifact exists
      if (!fs.existsSync(artifactPath)) {
        console.log(`⚠️ Artifact not found for ${contractName}. Make sure to compile contracts first.`);
        continue;
      }
      
      // Read artifact file
      const artifact = require(artifactPath);
      
      // Extract ABI
      const abi = {
        abi: artifact.abi,
        contractName,
      };
      
      // Save to abis directory in contracts folder
      const abiPath = path.join(abiDir, `${contractName}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
      
      // Save to client directory
      const clientPath = path.join(clientAbiDir, `${contractName}.json`);
      fs.writeFileSync(clientPath, JSON.stringify(abi, null, 2));
      
      console.log(`✅ Exported ABI for ${contractName}`);
    } catch (error) {
      console.error(`❌ Error exporting ABI for ${contractName}:`, error);
    }
  }
  
  console.log('ABI export complete!');
  
  // If we have a deployedAddresses.json file, copy that too
  const deployedAddressesPath = path.resolve(__dirname, '../deployedAddresses.json');
  if (fs.existsSync(deployedAddressesPath)) {
    const clientAddressPath = path.join(clientAbiDir, 'deployedAddresses.json');
    fs.copyFileSync(deployedAddressesPath, clientAddressPath);
    console.log('✅ Copied deployed addresses to client');
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });