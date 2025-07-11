/* TODO:
Currently, this script tests for age >= { 18 }. We want to be able to test for multiple age conditions, which will require a test age input from the Provider.

Example: age >= test-age or age <= test-age

This case allows for us to prove for multiple use cases: Examination Centers, Amusement Parks, Proof of being a sexagenarian (>=60)

*/
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { groth16 } = require('snarkjs')
const path = require('path')

let ageVerifier, owner;

describe('AgeVerifier', () => {
  before(async () => {
    const Verifier = await ethers.getContractFactory('Groth16Verifier')
    const AgeVerifier = await ethers.getContractFactory('AgeVerifier')

    const accounts = await ethers.getSigners()
    owner = accounts[0]

    const verifier = await Verifier.deploy()
    const verifierAddress = await verifier.getAddress();

    ageVerifier = await AgeVerifier.deploy(verifierAddress)
  })

  const wasmFilePath = path.join(__dirname, '../circuits/build/snark/age-verification.wasm');
  const finalZkeyPath = path.join(__dirname, '../circuits/build/snark/age-verification_final.zkey');
  // console.log(wasmFilePath + "\n" + finalZkeyPath);

  it('Should verify if age is above 18', async () => {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - 20; // 20 years old
    const challenge = "test-challenge-123";
    
    const witness = { 
      dobYear: birthYear,
      referenceYear: currentYear,
      challenge: challenge
    };

    const { proof, publicSignals } = await groth16.fullProve(witness, wasmFilePath, finalZkeyPath, null);

    const solidityProof = [
      proof.pi_a[0],
      proof.pi_a[1],
      proof.pi_b[0][1],
      proof.pi_b[0][0],
      proof.pi_b[1][1],
      proof.pi_b[1][0],
      proof.pi_c[0],
      proof.pi_c[1]
    ];

    const transaction = ageVerifier.verifyAge(solidityProof, publicSignals);
    await expect(transaction).to.emit(ageVerifier, 'AgeVerified').withArgs(owner.address);
  })

  it('should reject age 17 (invalid)', async () => {
    try {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - 17; // 17 years old
      const challenge = "test-challenge-456";
      
      const witness = { 
        dobYear: birthYear,
        referenceYear: currentYear,
        challenge: challenge
      };
      
      await groth16.fullProve(witness, wasmFilePath, finalZkeyPath);
      throw new Error("Proof should have failed but succeeded");
    } catch (err) {
      expect(err.message).to.include('Assert Failed'); // or just check that error occurred
    }
  });
})