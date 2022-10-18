import { VM } from 'vm2';
import fs from 'fs';

try {
  const { code, scope } = JSON.parse(fs.readFileSync(0, 'utf-8'));

  const evaluate = (script, scope) => {
    const vm = new VM({
      allowAsync: true,
      sandbox: scope
    });

    return vm.run(script, scope);
  };

  const result = evaluate(code, {
    ...scope,
    module: {}
  });

  console.log(JSON.stringify({
    result
  }));
} catch (error) {
  console.log(JSON.stringify({
    error: error.toString()
  }));
}
