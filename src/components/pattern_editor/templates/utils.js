export function toHex(v, s) {
  return (`0000${v.toString(16).toUpperCase()}`).substr(-s);
}
export const noteNames = [
  'C-', 'C#', 'D-', 'D#', 'E-', 'F-',
  'F#', 'G-', 'G#', 'A-', 'A#', 'B-',
];
export function toNote(n) {
  if (!n || n < 0) return '---';
  if (n === 96) return '^^^';
  return noteNames[n % 12] + ~~(n / 12); // eslint-disable-line no-bitwise
}

export function toInstrument(n) {
  if (!n || n < 0) return '--';
  return toHex(n, 2);
}

export function toVolume(n) {
  if (!n || n < 0) return '--';
  return toHex(n, 2);
}

export function toPanning(n) {
  if (!n || n < 0) return '--';
  return toHex(n, 2);
}

export function toDelay(n) {
  if (!n || n < 0) return '--';
  return toHex(n, 2);
}

export function toFX(t, p) {
  if (!t) return '----';
  return `${toHex(t, 2)}${toHex(p, 2)}`;
}
