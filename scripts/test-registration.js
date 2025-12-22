const { exec } = require('child_process');

console.log('Running registration system tests...\n');

exec('npm run test:registration', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  
  console.log(`Stdout: ${stdout}`);
});