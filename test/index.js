import test from 'basictap';
import findProcessByPartialName from './utils/findProcessByPartialName.js';
import run from '../lib/index.js';

test('single expression', async t => {
  const code = `
    const add = (a, b) => a + b;

    add(1, 2);
  `;

  const result = await run(code);

  t.equal(result, 3);
});

test('syntax error code', async t => {
  t.plan(1);

  const code = `
    const add;
  `;

  run(code).catch(error => {
    t.ok(error.message.includes('Missing initializer in const declaration'));
  });
});

test('falsey scope is overridden', async t => {
  const code = `
    const add = (a, b) => a + b;

    add(1, 2);
  `;

  const result = await run(code, null);

  t.equal(result, 3);
});

test('with scope', async t => {
  const code = 'a + b';

  const result = await run(code, {
    a: 1,
    b: 2
  });

  t.equal(result, 3);
});

test('with sync blocking script', async t => {
  t.plan(2);

  const code = `
    while (true) {}
  `;

  await run(code, {}, { time: 100 })
    .catch(error => {
      t.equal(error.message, 'code execution took too long and was killed');
    });

  const processCount = await findProcessByPartialName('vm2-process-runner');

  t.equal(processCount, 0);
});

test('with memory overspill', async t => {
  t.plan(2);

  const code = `
    const a = [];
    while (true) {
      a.push(1);
    }
  `;

  await run(code, {}, { time: 5000, memory: 1 })
    .catch(error => {
      t.equal(error.message, 'code execution exceeed allowed memory');
    });

  const processCount = await findProcessByPartialName('vm2-process-runner');

  t.equal(processCount, 0);
});

test('with cpu limit', async t => {
  t.plan(4);
  t.timeout(5000);

  const code = `
    1 + 1;
  `;

  const goodStartTime = Date.now();
  await run(code, {}, { time: 5000, memory: 1 })
    .catch(error => {
      t.equal(error.message, 'code execution exceeed allowed memory');
    });
  const goodDuration = Date.now() - goodStartTime;

  const startTime = Date.now();
  const result = await run(code, {}, { time: 4000, cpu: 1 });
  const duration = Date.now() - startTime;
  t.equal(result, 2);
  t.ok(duration > goodDuration, `take longer ${duration} than normal test ${goodDuration}`);

  const processCount = await findProcessByPartialName('vm2-process-runner');

  t.equal(processCount, 0);
});
