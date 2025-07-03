const { config } = require('../package.json')

function main() {
    const buildPath = config.paths.build.snark;
    const solidityVersion = config.solidity.version;
    console.log("Build Path: "+buildPath+"\nSolidity Version: "+solidityVersion);
};

main();