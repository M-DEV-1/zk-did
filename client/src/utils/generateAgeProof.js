import * as snarkjs from "snarkjs";
// import fs from "fs";

export async function generateAgeProof(dob) {
  // Sanitize and check DOB
  if (!dob || isNaN(new Date(dob))) {
    throw new Error("Invalid date of birth format.");
  }

  const birthYear = new Date(dob).getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();
  const age = Math.floor(currentYear - birthYear);

  if (age < 0 || age > 150) {
    throw new Error("Unrealistic age computed from DOB.");
  }

  const wasmUrl = "/api/snark-artifacts/age-verification.wasm";
  const zkeyUrl = "/api/snark-artifacts/age-verification_final.zkey";

  // check if wasm + zkey exist and are accessible
  const [wasmResp, zkeyResp] = await Promise.all([
    fetch(wasmUrl, { method: "HEAD" }),
    fetch(zkeyUrl, { method: "HEAD" }),
  ]);

  console.log("wasmResp: " + wasmResp + "\nzkeyResp: " + zkeyResp);

  if (!wasmResp.ok) {
    throw new Error("Missing or inaccessible age-verification.wasm. Did you compile the circuit?");
  }

  if (!zkeyResp.ok) {
    throw new Error("Missing or inaccessible age-verification_final.zkey. Did you run compile-circuits?");
  }
  
  // console.log("wasmResp: "+wasmResp+"\nzkeyResp: "+zkeyResp+"\nwasmBuffer: "+wasmBuffer)

  // perform proof generation
  const input = { age };

  try {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmUrl, zkeyUrl);
    console.log(proof);

    // fs.writeFile(proof, "a.txt");

    return {
      protocol: "groth16",
      curve: "bn128",
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      publicSignals
    };
  } catch (err) {
    throw new Error("Proof generation failed: " + err.message);
  }
}