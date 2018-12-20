import test from 'tape';
import wasm from '../../src/transformers/wasm';

test('wasm wraps wasm into amd module', t => {
  const source = 'abc';
  const target = "define('raw!a.wasm',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return Promise.resolve(a.decode(\"abc\"));}}});";

  t.deepEqual(wasm('a.wasm', source), {
    defined: 'raw!a.wasm',
    contents: target,
    deps: ['base64-arraybuffer']
  });
  t.end();
});