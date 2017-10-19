const fs = require('fs');
const path = require('path');

exports.addSshKey = function addSshKey(machine) {
  // Try to get a SSH public key to use by looking for one in ~/.ssh/id_rsa.pub.
  const publicKeyFile = path.join(process.env.HOME, '.ssh/id_rsa.pub');
  if (fs.existsSync(publicKeyFile)) {
    const sshPublicKey = fs.readFileSync(publicKeyFile, 'utf8');
    machine.sshKeys.push(sshPublicKey);
  } else {
    console.warn(`No SSH public key found in ${publicKeyFile}. ` +
        'Machines will still be launched, but will not allow SSH acesss. ' +
        'If you\'d like to enable SSH access, use the ssh-keygen command to ' +
        'generate a public SSH key and then re-run this blueprint.');
  }
};
