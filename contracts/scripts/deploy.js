const { ethers } = require('hardhat');

const main = async () => {
  try {
    // const Verifier = await ethers.getContractFactory('Verifier')
    const Verifier = await ethers.getContractFactory('Groth16Verifier');
    const AgeVerifier = await ethers.getContractFactory('AgeVerifier');

    console.log('Deploying verifier on Ethereum verifier...');

    const verifier = await Verifier.deploy();
    await verifier.deploymentTransaction().wait();

    const ageVerifier = await AgeVerifier.deploy(await verifier.getAddress());
    await ageVerifier.deploymentTransaction().wait();

    console.log("Verifier deployed at:", await verifier.getAddress());
    console.log("AgeVerifier deployed at:", await ageVerifier.getAddress());
  } catch (error) {
    console.error(error);
    process.exit(1);

  }
}

main()
  .then(() => process.exit(0))
  .catch ((error) => {
  console.error(error);
  process.exit(1);
})
