import { spawn } from 'node:child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const kill = child => {
  spawn('sh', ['-c', `kill -INT -${child.pid}`]);
};

const launch = (code, scope, limits) =>
  new Promise((resolve, reject) => {
    scope = scope || {};

    limits = Object.assign({
      cpu: 100,
      memory: 2000,
      time: 1000
    }, limits);

    const runner = spawn('cpulimit', [
      '-ql', limits.cpu,
      '--',
      'node', `--max-old-space-size=${limits.memory}`, 'vm2-process-runner.js'
    ], { cwd: __dirname, detached: true, timeout: limits.time });
    const buffer = [];

    runner.stdin.write(JSON.stringify({
      code, scope
    }) + '\n');
    runner.stdin.end();

    const timer = setTimeout(() => {
      kill(runner);
      reject(new Error('code execution took too long and was killed'));
    }, limits.time);

    runner.stdout.on('data', (data) => {
      buffer.push(data);
    });

    runner.stderr.on('data', (data) => {
      buffer.push(data);
    });

    runner.on('close', () => {
      try {
        const result = JSON.parse(buffer.join('').toString());

        if (result.error) {
          reject(new Error('unable to execute script:\n' + result.error + '\n' + buffer.join('').toString()));
          return;
        }

        resolve(result.result);
      } catch (error) {
        const result = buffer.join('').toString();
        if (result.includes('# Fatal javascript OOM in GC during deserialization')) {
          reject(new Error('code execution exceeed allowed memory'));
          return;
        }
        reject(new Error('unable to execute script:\n' + error.message + '\n' + buffer.join('').toString()));
      } finally {
        kill(runner);
        clearTimeout(timer);
      }
    });
  });

export default launch;
