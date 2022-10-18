# vm2-process
Run untrusted code via [vm2](https://github.com/patriksimek/vm2), but inside a separate process which has additional restrictions:
1. Limit how much of a CPU can be used
2. Limit how much memory can be used
3. Limit how much time it can take (even if blocked by sync code)

## Installation

```
npm install --save vm2-process
```

## Default limits
The following limits are the default, but they can be overridden.
<table>
<tr><td>CPU</td><td>100 percent</td></tr>
<tr><td>Memory</td><td>2000 megabytes</td></tr>
<tr><td>Execution Time</td><td>1000 milliseconds</td></tr>
</table>

## Usage

### Simple usage with only code
```javascript
import run from 'vm2-process';
const result = await run('1 + 1');

console.log(result) // prints '2'
```

### Simple usage with some scope
```javascript
import run from 'vm2-process';
const result = await run('1 + a', { a: 2 })

console.log(result) // prints '3'
```

### Simple usage with some limits
```javascript
import run from 'vm2-process';
const result = await run('while (true) {}', null {
  cpu: 100, /* in percent */
  memory: 2000, /* in megabytes */
  time: 1000 /* in milliseconds */
});

// above throws as it either takes too long or exceeds the memory limit
```
