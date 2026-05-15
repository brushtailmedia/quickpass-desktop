// Phase 0 oracle generator.
//
// Captures the FROZEN pre-migration output of the current password core so that,
// after `----` is repurposed as the legacy-V.1 anchor and V.1-V.15 are modernized,
// we can prove `----` still reproduces today's V.1 byte-for-byte.
//
// Run BEFORE any core changes:  node ./scripts/gen-golden-vectors.mjs
// Output: scripts/golden-vectors.json  (commit this; never regenerate post-migration)

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { passGen, VERSION_DICT } from '../src/core.js';

const here = dirname(fileURLToPath(import.meta.url));

// Inputs chosen to exercise the obs-1 / obs-2 paths the migration touches:
// - key-64-boundary: myKey is exactly 64 bytes, so blake2s hits the
//   length % 64 === 0 path (the non-standard extra-empty-final-block quirk).
// - unicode: multibyte TextEncoder lengths.
// - empty / tiny: minimal key, exercises padKey growth from a short seed.
const INPUTS = [
  { name: 'canonical-1', master: 'mysupersecretpassword', site: 'github/work' },
  { name: 'canonical-2', master: 'correct horse battery staple', site: 'user@example.com' },
  { name: 'tiny', master: 'a', site: 'b' },
  { name: 'empty', master: '', site: '' },
  { name: 'key-64-boundary', master: 'a'.repeat(31), site: 'b'.repeat(32) },
  { name: 'unicode', master: 'pässwörd\u{1F510}', site: 'café/münchen' },
  { name: 'long', master: 'x'.repeat(200), site: 'y'.repeat(120) },
];
const TYPES = [0, 1, 2];
const LENGTHS = [8, 10, 15, 20, 32, 40];
const VERSIONS = ['----', 'V.1', 'V.2', 'V.7', 'V.13', 'V.15'];

const records = [];
for (const { name, master, site } of INPUTS) {
  for (const version of VERSIONS) {
    for (const type of TYPES) {
      for (const length of LENGTHS) {
        // eslint-disable-next-line no-await-in-loop
        const output = await passGen(master, site, type, length, version);
        records.push({ name, master, site, version, type, length, output });
      }
    }
  }
}

const payload = {
  note: 'FROZEN pre-migration oracle. The version="V.1" records are the immutable '
    + 'target the post-migration `----` (legacy) path must reproduce exactly. '
    + 'Do NOT regenerate after the algorithm fork.',
  generatedAt: new Date().toISOString(),
  versionDict: VERSION_DICT,
  count: records.length,
  records,
};

const outPath = join(here, 'golden-vectors.json');
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`golden vectors written: ${records.length} records -> ${outPath}`);
