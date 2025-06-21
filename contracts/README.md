# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

## Note: 

If any of these commands do not run, and you get errors like: 
```
Error HH505: A native version of solc failed to run.

If you are running MacOS, try installing Apple Rosetta.

If this error persists, run "npx hardhat clean --global".

For more info go to https://hardhat.org/HH505 or run Hardhat with --show-stack-traces
```

You can try installing `solc` natively.

```
npm install --global solc
```
