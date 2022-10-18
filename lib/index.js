import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import genericPool from 'generic-pool';
import finalStream from 'final-stream';

const waitUntil = (condition) => {
  if (condition()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (!condition()) {
        return;
      }

      clearInterval(interval);
      resolve();
    }, 0);
  });
};

const __dirname = dirname(fileURLToPath(import.meta.url));

const kill = child => {
  spawn('sh', ['-c', `kill -INT -${child.pid}`]);
};

const createVm2Pool = ({ min, max, ...limits }) => {
  limits = Object.assign({
    cpu: 100,
    memory: 2000,
    time: 4000
  }, limits);

  let limitError = null;

  let stderrCache = '';
  const factory = {
    create: function () {
      const runner = spawn('cpulimit', [
        '-ql', limits.cpu,
        '--',
        'node', `--max-old-space-size=${limits.memory}`, 'vm2-process-runner.js'
      ], { cwd: __dirname, detached: true });

      runner.stdout.on('data', (data) => {
        runner.socket = runner.socket || data.toString().trim();
      });

      runner.stderr.on('data', (data) => {
        stderrCache = stderrCache + data.toString();
        if (stderrCache.includes('FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory')) {
          limitError = 'code execution exceeed allowed memory';
        }
      });

      return runner;
    },

    destroy: function (childProcess) {
      kill(childProcess);
    }
  };

  const pool = genericPool.createPool(factory, { min, max });

  const run = async (code, scope) => {
    const childProcess = await pool.acquire();

    await waitUntil(() => childProcess.socket);

    const socket = net.createConnection(childProcess.socket);

    const timer = setTimeout(() => {
      limitError = 'code execution took too long and was killed';
      kill(childProcess);
    }, limits.time);

    socket.write(JSON.stringify({ code, scope }) + '\n');

    try {
      const data = await finalStream(socket).then(JSON.parse);

      if (data.error) {
        throw new Error(data.error);
      }

      return data.result;
    } catch (error) {
      throw new Error(limitError || error);
    } finally {
      clearTimeout(timer);
      pool.destroy(childProcess);
    }
  };

  return {
    run,
    drain: () => {
      pool.drain().then(() => pool.clear());
    }
  };
};

export default createVm2Pool;
