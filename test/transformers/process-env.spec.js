const test = require('tape');
const processEnv = require('../../lib/transformers/process-env');

test('processEnv bypasses local file', t => {
  const unit = {
    path: 'src/process.js',
    contents: 'lorem',
    sourceMap: undefined,
    moduleId: 'process'
  };

  t.notOk(processEnv(unit));
  t.end();
});

test('processEnv bypasses other npm package', t => {
  const unit = {
    path: 'node_modules/process2/index.js',
    contents: 'lorem',
    sourceMap: undefined,
    moduleId: 'process2/index',
    packageName: 'process2'
  };

  t.notOk(processEnv(unit));
  t.end();
});

test('processEnv add NODE_ENV to npm package "process"', t => {
  const unit = {
    path: 'node_modules/process/browser.js',
    contents: 'lorem',
    sourceMap: undefined,
    moduleId: 'process/browser',
    packageName: 'process'
  };

  t.deepEqual(processEnv(unit, {NODE_ENV: 'foo'}), {contents: 'lorem\nprocess.env = {"NODE_ENV":"foo"};\n'});
  t.end();
});
