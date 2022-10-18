import { exec } from 'child_process';

const findProcessByPartialName = partialName =>
  new Promise((resolve, reject) => {
    exec(`ps -aux | grep ${partialName}`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error('could not execute findProcessByPartialName'));
        return;
      }

      resolve(
        stdout
          .split('\n')
          .filter(line => line && !line.includes(`grep ${partialName}`))
          .length
      );
    });
  });

export default findProcessByPartialName;
