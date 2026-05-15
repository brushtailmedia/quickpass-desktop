const ALLCHAR =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~0123456789 ';

const VERSION_DICT = {
  '----': 0,
  'V.1': 64,
  'V.2': 128,
  'V.3': 192,
  'V.4': 256,
  'V.5': 320,
  'V.6': 384,
  'V.7': 512,
  'V.8': 576,
  'V.9': 768,
  'V.10': 896,
  'V.11': 960,
  'V.12': 1024,
  'V.13': 2048,
  'V.14': 4096,
  'V.15': 8192,
};

const B85_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~';
const LIMITED_SPECIAL_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';

const BLAKE2S_IV = new Uint32Array([
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19,
]);

const BLAKE2S_SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
];

function rotr32(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function bytesToB85(bytes) {
  let out = '';
  const fullBlocks = Math.floor(bytes.length / 4);
  const divisor = 85;

  for (let i = 0; i < fullBlocks; i += 1) {
    const j = i * 4;
    let value =
      (bytes[j] * 16777216) +
      (bytes[j + 1] * 65536) +
      (bytes[j + 2] * 256) +
      bytes[j + 3];

    const chunk = new Array(5);
    for (let k = 4; k >= 0; k -= 1) {
      const index = value % divisor;
      chunk[k] = B85_ALPHABET[index];
      value = Math.floor(value / divisor);
    }
    out += chunk.join('');
  }

  const remaining = bytes.length % 4;
  if (remaining > 0) {
    const tail = new Uint8Array(4);
    const start = fullBlocks * 4;
    for (let i = 0; i < remaining; i += 1) {
      tail[i] = bytes[start + i];
    }

    let value =
      (tail[0] * 16777216) +
      (tail[1] * 65536) +
      (tail[2] * 256) +
      tail[3];

    const chunk = new Array(5);
    for (let k = 4; k >= 0; k -= 1) {
      const index = value % divisor;
      chunk[k] = B85_ALPHABET[index];
      value = Math.floor(value / divisor);
    }
    out += chunk.slice(0, remaining + 1).join('');
  }

  return out;
}

function blake2s(bytes) {
  const h = new Uint32Array(BLAKE2S_IV);
  h[0] ^= 0x01010020;

  let t0 = 0;
  let t1 = 0;

  const v = new Uint32Array(16);
  const m = new Uint32Array(16);

  const compress = (block, isLast, bytesInBlock) => {
    for (let i = 0; i < 16; i += 1) {
      const j = i * 4;
      m[i] =
        (block[j] >>> 0) |
        ((block[j + 1] << 8) >>> 0) |
        ((block[j + 2] << 16) >>> 0) |
        ((block[j + 3] << 24) >>> 0);
    }

    for (let i = 0; i < 8; i += 1) {
      v[i] = h[i];
      v[i + 8] = BLAKE2S_IV[i];
    }

    t0 = (t0 + bytesInBlock) >>> 0;
    if (t0 < bytesInBlock) {
      t1 = (t1 + 1) >>> 0;
    }

    v[12] ^= t0;
    v[13] ^= t1;
    if (isLast) {
      v[14] ^= 0xffffffff;
    }

    const g = (a, b, c, d, x, y) => {
      v[a] = (v[a] + v[b] + x) >>> 0;
      v[d] = rotr32(v[d] ^ v[a], 16);
      v[c] = (v[c] + v[d]) >>> 0;
      v[b] = rotr32(v[b] ^ v[c], 12);
      v[a] = (v[a] + v[b] + y) >>> 0;
      v[d] = rotr32(v[d] ^ v[a], 8);
      v[c] = (v[c] + v[d]) >>> 0;
      v[b] = rotr32(v[b] ^ v[c], 7);
    };

    for (let round = 0; round < 10; round += 1) {
      const s = BLAKE2S_SIGMA[round];

      g(0, 4, 8, 12, m[s[0]], m[s[1]]);
      g(1, 5, 9, 13, m[s[2]], m[s[3]]);
      g(2, 6, 10, 14, m[s[4]], m[s[5]]);
      g(3, 7, 11, 15, m[s[6]], m[s[7]]);
      g(0, 5, 10, 15, m[s[8]], m[s[9]]);
      g(1, 6, 11, 12, m[s[10]], m[s[11]]);
      g(2, 7, 8, 13, m[s[12]], m[s[13]]);
      g(3, 4, 9, 14, m[s[14]], m[s[15]]);
    }

    for (let i = 0; i < 8; i += 1) {
      h[i] = (h[i] ^ v[i] ^ v[i + 8]) >>> 0;
    }
  };

  const full = Math.floor(bytes.length / 64);
  for (let i = 0; i < full; i += 1) {
    const block = bytes.slice(i * 64, i * 64 + 64);
    compress(block, false, 64);
  }

  const lastSize = bytes.length % 64;
  const lastBlock = new Uint8Array(64);
  if (lastSize > 0) {
    lastBlock.set(bytes.slice(full * 64));
    compress(lastBlock, true, lastSize);
  } else {
    compress(lastBlock, true, 0);
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i += 1) {
    out[i * 4] = h[i] & 0xff;
    out[i * 4 + 1] = (h[i] >>> 8) & 0xff;
    out[i * 4 + 2] = (h[i] >>> 16) & 0xff;
    out[i * 4 + 3] = (h[i] >>> 24) & 0xff;
  }
  return out;
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(new Uint8Array(digest));
}

async function sha256Bytes(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest);
}

function blake2sHex(value) {
  const bytes = new TextEncoder().encode(value);
  return toHex(blake2s(bytes));
}

async function bytesToLimitedCharset(bytes, length) {
  let out = '';
  let state = new Uint8Array(bytes);
  let cursor = 0;

  while (out.length < length) {
    if (cursor >= state.length) {
      state = await sha256Bytes(state);
      cursor = 0;
    }

    out += LIMITED_SPECIAL_CHARSET[state[cursor] % LIMITED_SPECIAL_CHARSET.length];
    cursor += 1;
  }

  return out;
}

function pCipher(key, message, mode = 'encrypt') {
  let translated = '';
  let keyIndex = 0;

  for (const symbol of message) {
    let num = ALLCHAR.indexOf(symbol);
    if (num === -1) {
      num = symbol.codePointAt(0);
    }

    if (mode === 'encrypt') {
      num += ALLCHAR.indexOf(key[keyIndex]);
    } else if (mode === 'decrypt') {
      num -= ALLCHAR.indexOf(key[keyIndex]);
    }

    num %= ALLCHAR.length;
    translated += ALLCHAR[num];

    keyIndex += 1;
    if (keyIndex === key.length) {
      keyIndex = 0;
    }
  }

  return translated;
}

function padKey(key, length = 64) {
  let paddedKey = key;

  while (paddedKey.length < length - 1) {
    const hash1 = blake2sHex(paddedKey);
    const hash2 = blake2sHex(hash1 + key);
    paddedKey += pCipher(hash2, hash1);
    paddedKey = paddedKey.slice(0, length);
  }

  return paddedKey;
}

export async function passGen(masterKey, siteName, type = 0, length = 20, version = 'V.1') {
  const myKey = `${masterKey}:${siteName}`;
  const newKey = padKey(myKey, VERSION_DICT[version]);
  const hashHex = await sha256Hex(newKey);
  const hashBytes = hexToBytes(hashHex);

  if (type === 0) {
    return bytesToBase64(hashBytes)
      .slice(0, length)
      .replaceAll('+', 'E')
      .replaceAll('/', 'a');
  }

  if (type === 2) {
    return bytesToLimitedCharset(hashBytes, length);
  }

  return bytesToB85(hashBytes).slice(0, length);
}

export { VERSION_DICT };
