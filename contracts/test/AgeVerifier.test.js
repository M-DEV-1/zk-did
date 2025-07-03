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
  console.log(wasmFilePath + "\n" + finalZkeyPath);

  const testCases = [
    { label: '> 18 (should pass)', age: 20, shouldPass: true },
    { label: '= 18 (should fail)', age: 18, shouldPass: false },
    { label: '< 18 (should fail)', age: 17, shouldPass: false },
    { label: 'just under 18 (should fail)', age: 17, shouldPass: false },
    { label: 'way over 18 (should pass)', age: 99, shouldPass: true },
    { label: 'random edge case (should fail)', age: 0, shouldPass: false }
  ];

  testCases.forEach(({ label, age, shouldPass }) => {
    it(`Proves: ${label}`, async () => {
      const input = { age: age.toString() };

      // Generate proof — may throw error if circuit rejects invalid input
      let proof, publicSignals;
      try {
        ({ proof, publicSignals } = await groth16.fullProve(input, wasmFilePath, finalZkeyPath));
      } catch (err) {
        if (shouldPass) throw err; // Test should fail if this was unexpected
        return; // Circuit correctly rejected bad input (e.g. age < 18)
      }

      // Circuit didn't fail — proceed to call contract
      const proofArray = [
        proof.pi_a[0],
        proof.pi_a[1],
        proof.pi_b[0][1],
        proof.pi_b[0][0],
        proof.pi_b[1][1],
        proof.pi_b[1][0],
        proof.pi_c[0],
        proof.pi_c[1]
      ];
      const inputSignals = publicSignals.map(x => x.toString());

      if (shouldPass) {
        const tx = await ageVerifier.verifyAge(proofArray, inputSignals);
        await expect(tx).to.emit(ageVerifier, 'AgeVerified').withArgs(owner.address);
      } else {
        await expect(ageVerifier.verifyAge(proofArray, inputSignals)).to.be.reverted;
      }
    });
  });
});