import { VM } from 'vm2';
import net from 'net';
import crypto from 'crypto';

const evaluate = (script, scope) => {
  const vm = new VM({
    allowAsync: true,
    sandbox: scope
  });

  return vm.run(script, scope);
};

const socketName = crypto.randomBytes(20).toString('hex');

const server = net.createServer((socket) => {
  const buffer = [];

  const sync = () => {
    const request = buffer.join('').toString();
    if (request.includes('\n')) {
      try {
        const { code, scope } = JSON.parse(request);
        const result = evaluate(code, {
          ...scope,
          module: {}
        });

        socket.write(JSON.stringify({ result }) + '\n');
        socket.end();
      } catch (error) {
        socket.write(JSON.stringify({ error: error.message }) + '\n');
        socket.end();
      }
    }
  };

  socket.on('data', data => {
    buffer.push(data);
    sync();
  });
});

server.on('listening', () => {
  console.log(`/tmp/vm2-${socketName}.sock`);
});

server.listen(`/tmp/vm2-${socketName}.sock`);
