import assert from 'node:assert/strict';
import { passGen } from '../src/core.js';

const vectors = [
  {
    input: ['mysupersecretpassword', 'github/work', 0, 20, 'V.1'],
    expected: 'LDXfdUT6X7Ucm8nEQEfg'
  },
  {
    input: ['mysupersecretpassword', 'github/work', 2, 20, 'V.1'],
    expected: 'S1)P&wtDCdXA#)_lNCy7'
  },
  {
    input: ['mysupersecretpassword', 'github/work', 1, 20, 'V.1'],
    expected: 'EH&SCMEYN~9Gl7hKu6$L'
  },
  {
    input: ['correct horse battery staple', 'user@example.com', 0, 32, 'V.15'],
    expected: 'PYjEXFCAfzLFl6FC7awpXIx913bTEXn7'
  },
  {
    input: ['correct horse battery staple', 'user@example.com', 2, 32, 'V.15'],
    expected: '98Sqe0ZYT=j%lyPq#X@Q7rTx7nb!FBY@'
  },
  {
    input: ['correct horse battery staple', 'user@example.com', 1, 32, 'V.15'],
    expected: 'J&43yP=J3j#h0N%@BArTjD6R3(-C?5I}'
  }
];

for (const { input, expected } of vectors) {
  const actual = await passGen(...input);
  assert.equal(actual, expected, `Vector mismatch for ${JSON.stringify(input)}`);
}

console.log('tauri vectors: ok');
