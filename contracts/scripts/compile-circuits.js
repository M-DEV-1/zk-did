/*

this is a custom script that we've written to facilitate the zk-snark proof generation process
this script covers:

1. circuit compilation

2. r1cs, wasm file generations

3. poweroftau ceremony

4. .zkey, .proof file generations

5. clean up, keeping only what's needed

6. generating verification-key.json for all circuits

*/
const fs = require("fs");
const path = require("path");
const download = require("download");
const rimraf = require("rimraf");
const { zKey } = require("snarkjs");
const { config } = require("../package.json");
const { asyncExec } = require("./utils");

const circuits = ["age", "location"];  
const ptauPath = `./circuits/powersoftau/powersOfTau28_hez_final_14.ptau`;
const buildPath = config.paths.build.snark;
const solidityVersion = config.solidity.version;

const compileCircuit = async (circuitName) => {
  try {
    const circuitFile = `./circuits/${circuitName}.circom`;

    if (!fs.existsSync(buildPath)) {
      fs.mkdirSync(buildPath, { recursive: true });
    }

    if (!fs.existsSync(ptauPath)) {
      console.log(`PTAU file missing, downloading from GCP...`);
      await download(
        "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau",
        path.dirname(ptauPath)
      );
      console.log(`Downloaded PTAU to ${ptauPath}`);
    }

    await asyncExec(`circom ${circuitFile} --r1cs --wasm -o ${buildPath}`);

    await zKey.newZKey(
      `${buildPath}/${circuitName}.r1cs`,
      ptauPath,
      `${buildPath}/${circuitName}_0000.zkey`,
      console
    );

    await zKey.beacon(
      `${buildPath}/${circuitName}_0000.zkey`,
      `${buildPath}/${circuitName}_final.zkey`,
      'Final Beacon',
      '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      10,
      console
    );

    let verifierCode = await zKey.exportSolidityVerifier(
      `${buildPath}/${circuitName}_final.zkey`,
      {
        groth16: fs.readFileSync(
          './node_modules/snarkjs/templates/verifier_groth16.sol.ejs', 'utf8'
        )
      },
      console
    );

    verifierCode = verifierCode.replace(
      /pragma solidity \^\d+\.\d+\.\d+/,
      `pragma solidity ^${solidityVersion}`
    );

    fs.writeFileSync(`${config.paths.contracts}/Verifier${capitalize(circuitName)}.sol`, verifierCode, 'utf-8');

    const verificationKey = await zKey.exportVerificationKey(
      `${buildPath}/${circuitName}_final.zkey`,
      console
    );

    fs.writeFileSync(
      `${buildPath}/${circuitName}_verification_key.json`,
      JSON.stringify(verificationKey),
      'utf-8'
    );

    fs.renameSync(
      `${buildPath}/${circuitName}_js/${circuitName}.wasm`,
      `${buildPath}/${circuitName}.wasm`
    );
    rimraf.sync(`${buildPath}/${circuitName}_js`);
    rimraf.sync(`${buildPath}/${circuitName}_0000.zkey`);
    rimraf.sync(`${buildPath}/${circuitName}.r1cs`);
  } catch (err) {
    console.error(`Error in ${circuitName} circuit:`, err);
    process.exit(1);
  }
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const main = async () => {
  try {
    for (let circuit of circuits) {
      console.log(`Compiling ${circuit}...`);
      await compileCircuit(circuit);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
