const fs = require("fs");
const path = require("path");
const download = require("download");
const rimraf = require("rimraf");
const { zKey } = require("snarkjs");
const { config } = require("../package.json");
const { asyncExec } = require("./utils");

const circuitName = "age-verification";
const circuitFile = `./circuits/${circuitName}.circom`;
// TODO: add location proof circuit
const ptauPath = `./circuits/powersoftau/powersOfTau28_hez_final_14.ptau`;
const buildPath = config.paths.build.snark;
const solidityVersion = config.solidity.version;


const main = async () => {
  // check if build folder exists
  if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true })
  }

  // check if Ptau contributions file exists, if not download from the link
  // Ref: https://github.com/iden3/snarkjs?tab=readme-ov-file#7-prepare-phase-2
  if (!fs.existsSync(ptauPath)) {
    console.log(`PTAU file missing, downloading from GCP...`);
    await download(
      "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau",
      path.dirname(ptauPath)
    );
    console.log(`Downloaded PTAU to ${ptauPath}`);
  }

  // compile the circom circuit
  await asyncExec(`circom ${circuitFile} --r1cs --wasm -o ${buildPath}`)

  // generate initial key
  await zKey.newZKey(
    `${buildPath}/${circuitName}.r1cs`,
    ptauPath,
    `${buildPath}/${circuitName}_0000.zkey`,
    console
  )

  // apply beacon contribution
  await zKey.beacon(
    `${buildPath}/${circuitName}_0000.zkey`,
    `${buildPath}/${circuitName}_final.zkey`,
    'Final Beacon',
    '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    10,
    console
  )

  // generate Solidity Verifier and patch pragma
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

  fs.writeFileSync(`${config.paths.contracts}/Verifier.sol`, verifierCode, 'utf-8')

  // export verification key
  const verificationKey = await zKey.exportVerificationKey(
    `${buildPath}/${circuitName}_final.zkey`, 
    console
  );
  fs.writeFileSync(
    `${buildPath}/verification_key.json`, 
    JSON.stringify(verificationKey), 
    'utf-8'
  );

  // move wasm file to flat location and clean up
  fs.renameSync(
    `${buildPath}/${circuitName}_js/${circuitName}.wasm`, 
    `${buildPath}/${circuitName}.wasm`
  );
  rimraf.sync(`${buildPath}/${circuitName}_js`);
  rimraf.sync(`${buildPath}/powersOfTau28_hez_final_14.ptau`);
  rimraf.sync(`${buildPath}/${circuitName}_0000.zkey`);
  rimraf.sync(`${buildPath}/${circuitName}.r1cs`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
