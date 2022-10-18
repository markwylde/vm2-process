# vm2-process
Run untrusted code via [https://github.com/patriksimek/vm2](vm2), but inside a separate process which has additional restrictions:
1. Limit how much of a CPU can be used
2. Limit how much memory can be used
3. Limit how much time it can take (even if blocked by sync code)

## Installation

```
npm install --save vm2-process
```

## Default limits
The following limits are the default, but they can be overridden.
| CPU            | 100 percent       |
| Memory         | 2000 megabytes    |
| Execution Time | 1000 milliseconds |

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
const result = await run('1 + a', null {
  cpu: 100, /* in percent */
  memory: 2000, /* in megabytes */
  time: 1000 /* in milliseconds */
});

console.log(result) // prints '3'
```
