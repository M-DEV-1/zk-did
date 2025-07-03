const { exec } = require('child_process');
const { promisify } = require('util');

module.exports.asyncExec = async (_command) => {
  const { stderr, stdout } = await promisify(exec)(_command)
  if (stderr) {
    throw new Error(stderr)
  }
  console.info(stdout)
}
