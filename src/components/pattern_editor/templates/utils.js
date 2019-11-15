export function toHex(v, s) {
  return (`0000${v.toString(16).toUpperCase()}`).substr(-s);
}
export const noteNames = [
  'C-', 'C#', 'D-', 'D#', 'E-', 'F-',
  'F#', 'G-', 'G#', 'A-', 'A#', 'B-',
];
export function toNote(n) {
  if (!n || n < 0) return ['---', true];
  if (n === 96) return ['^^^', false];
  return [noteNames[n % 12] + ~~(n / 12), false]; // eslint-disable-line no-bitwise
}

export function toInstrument(n) {
  if (!n || n < 0) return ['--', true];
  return [toHex(n, 2), false];
}

export function toVolume(n) {
  if (!n || n < 0) return ['--', true];
  return [toHex(n, 2), false];
}

export function toPanning(n) {
  if (!n || n < 0) return ['--', true];
  return [toHex(n, 2), false];
}

export function toDelay(n) {
  if (!n || n < 0) return ['--', true];
  return [toHex(n, 2), false];
}

export function toFX(t, p) {
  if (!t) return ['----', true];
  return [`${toHex(t, 2)}${toHex(p, 2)}`, false];
}
