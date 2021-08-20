import lz4init from 'lz4-asm';
import lz4wasm from 'lz4-asm/dist/_lz4.wasm';

let lz4js;

export async function getLz4js() {
  if (lz4js === undefined) {
    const lz4 = await lz4init({ wasmBinary: lz4wasm });
    lz4js = lz4.lz4js;
  }
  return lz4js;
}
