import test from 'basictap';
import findProcessByPartialName from './utils/findProcessByPartialName.js';
import createVm2Pool from '../lib/index.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

test('single expression', async t => {
  const code = `
    const add = (a, b) => a + b;

    add(1, 2);
  `;

  const { run, drain } = createVm2Pool({ min: 1, max: 3 });

  const result = await run(code);

  t.equal(result, 3);

  drain();
});

test('full pool is fast', async t => {
  const code = `
    const add = (a, b) => a + b;

    add(1, 2);
  `;

  const { run, drain } = createVm2Pool({ min: 1, max: 3 });

  await sleep(1000); /* should be long enough to fill pool */

  const startTime = Date.now();
  const result = await run(code);
  const duration = Date.now() - startTime;

  t.ok(duration < 50, `should take less than 50ms (actual: ${duration}ms)`);
  t.equal(result, 3);

  drain();
});

test('syntax error code', async t => {
  t.plan(1);

  const code = `
    const add;
  `;

  const { run, drain } = createVm2Pool({ min: 1, max: 3 });

  await run(code).catch(error => {
    t.ok(error.message.includes('Missing initializer in const declaration'));
  });

  drain();
});

test('falsey scope is overridden', async t => {
  const code = `
    const add = (a, b) => a + b;

    add(1, 2);
  `;

  const { run, drain } = createVm2Pool({ min: 1, max: 3 });
  const result = await run(code, null);

  t.equal(result, 3);

  drain();
});

test('with scope', async t => {
  const code = 'a + b';

  const { run, drain } = createVm2Pool({ min: 1, max: 3 });
  const result = await run(code, {
    a: 1,
    b: 2
  });

  t.equal(result, 3);
  drain();
});

test('with sync blocking script', async t => {
  t.plan(2);

  const code = `
    while (true) {}
  `;

  const { run, drain } = createVm2Pool({ min: 1, max: 3, time: 100 });

  await run(code, {})
    .catch(error => {
      t.equal(error.message, 'code execution took too long and was killed');
    });

  const processCount = await findProcessByPartialName('vm2-process-runner');

  t.equal(processCount, 2 /* max - 1 */);

  drain();
});

test('with memory overspill', async t => {
  t.plan(2);

  const code = `
    const a = [];
    while (true) {
      a.push(1);
    }
  `;

  const { run, drain } = createVm2Pool({ min: 1, max: 3, time: 5000, memory: 10 });

  await run(code, {})
    .catch(error => {
      t.equal(error.message, 'code execution exceeed allowed memory');
    });

  const processCount = await findProcessByPartialName('vm2-process-runner');

  t.equal(processCount, 2 /* max - 1 */);

  drain();
});

test('with cpu limit', async t => {
  t.plan(3);

  const code = `
    let result = 0;
    for (var i = Math.pow(6, 7); i >= 0; i--) {
      result += Math.atan(i) * Math.tan(i);
    };
  `;

  const { run, drain } = createVm2Pool({ min: 1, max: 3, time: 500, cpu: 1 });

  const result = await run(code)
    .catch(error => {
      t.equal(error.message, 'code execution took too long and was killed');
      return null;
    });

  t.equal(result, null);

  const processCount = await findProcessByPartialName('vm2-process-runner');

  t.equal(processCount, 2 /* max - 1 */);

  drain();
});

test.skip('stress test', async t => {
  const code = `
    const add = (a, b) => a + b;

    add(1, 2);
  `;

  const { run, drain } = createVm2Pool({ min: 5, max: 10 });

  const promises = [];

  const startTime = Date.now();
  for (let i = 0; i < 100; i++) {
    promises.push(
      run(code)
    );
  }
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  const average = duration / 100;

  t.ok(average < 50, `average (${average}ms) is less than 50 ms on average`);
  t.ok(results.every(item => item === 3), [], 'all results were correct');

  drain();
});
