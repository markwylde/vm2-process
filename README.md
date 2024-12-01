# vm2-process

> vm2 has been deprecated and deemed not safe for production use
> [read more here](https://github.com/patriksimek/vm2?tab=readme-ov-file#%EF%B8%8F-project-discontinued-%EF%B8%8F)

Run untrusted code via [vm2](https://github.com/patriksimek/vm2), but inside a separate process which has additional restrictions:
1. Limit how much of a CPU can be used
2. Limit how much memory can be used
3. Limit how much time it can take (even if blocked by sync code)

## Installation

```
npm install --save vm2-process
```

## API
The `createVm2Pool` (default export) accepts the following options:

| Title          | Key    | Default           |
|----------------|--------|-------------------|
| Min Threads    | min    | -                 |
| Max Threads    | max    | -                 |
| CPU            | cpu    | 100 percent       |
| Memory         | memory | 2000 megabytes    |
| Execution Time | time   | 1000 milliseconds |

It will return a `run` function that takes two arguments: `run(code, scope)`

`code` is a string of JavaScript code.
`scope` is an object, of which will be globally accessible during execution.

Note: Communication is done via a unix socket, and therefore the scope,
and result from the execution needs to be JSON serializable.

## Usage

### Simple usage with only code
```javascript
import createVm2Pool from 'vm2-process';

const { run, drain } = createVm2Pool({ min: 1, max: 3 });
const result = await run('1 + 1');

console.log(result) // prints '2'

drain();
```

### Simple usage with some scope
```javascript
import createVm2Pool from 'vm2-process';

const { run, drain } = createVm2Pool({ min: 1, max: 3 });
const result = await run('1 + a', { a: 2 })

console.log(result) // prints '3'

drain();
```

### Simple usage with some limits
```javascript
import createVm2Pool from 'vm2-process';

const { run, drain } = createVm2Pool({
  min: 1, /* min threads in the pool */
  max: 3, /* max threads in the pool */
  cpu: 100, /* in percent */
  memory: 2000, /* in megabytes */
  time: 1000 /* in milliseconds */
});
const result = await run('while (true) {}', null);

// above throws as it either takes too long or exceeds the memory limit
drain();
```
