# zk-did

zk-did is an experimental project that explores decentralized identity using zero knowledge proofs. The idea is to let a user prove ownership of an identity or credential without revealing the underlying data. The repo combines smart contracts, circuits, and a client app to demonstrate the concept.

## Structure

* **client/** – A JavaScript frontend that handles user interaction and connects to the contracts
* **contracts/** – Solidity smart contracts, including the verifier and identity logic
* **circuits/** – Circom circuits for generating zk-SNARK proofs

## How it works

The circuits define the logic for proof generation, such as validating identity attributes without revealing them directly. The Solidity contracts verify these proofs on chain and maintain a simple registry for decentralized identifiers. The client ties everything together by compiling the circuits, generating proofs, and sending them to the contracts. Each part of the flow is implemented in dedicated files, the circuits handle constraints, the contracts handle verification, and the client provides the interface to interact with them.

## Requirements

* Node.js v18 (recommended to use with nvm)
* npm
* Hardhat for smart contract development
* Circom for compiling the circuits

## Getting started

Clone the repository and install dependencies:

```bash
git clone https://github.com/M-DEV-1/zk-did.git
cd zk-did
```

### Client

```bash
cd client
npm install
npm run dev
```

### Contracts

```bash
cd contracts
npm install
npx hardhat compile
```

### Circuits

Make sure you have Circom installed. Compile the circuits:

```bash
cd circuits
circom identity.circom --r1cs --wasm --sym
```

This generates the proving and verification keys that are used by the contracts and the client.

## Overview

The workflow is simple. A user generates a proof through the circuit, submits it to the contract, and the contract verifies the proof on chain. The client provides the interface for generating and submitting these proofs. Together, these pieces form the basic building blocks of a zero knowledge based decentralized identifier system.

