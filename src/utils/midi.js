import { eventSystem } from './events';

let midi = null;
function onMIDISuccess(midiAccess) {
  console.log('MIDI Ready');
  midi = midiAccess;
  midi.inputs.forEach((entry) => {
    entry.onmidimessage = onMIDIMessage;
  });
}

function onMIDIFailure(msg) {
  console.log(`Failed to get MIDI access ${msg}`);
}

function onMIDIMessage(event) {
  if (event.data[0] === 0x90) {
    eventSystem.raise('noteDown', event.data[1]);
  } else if (event.data[0] === 0x80) {
    eventSystem.raise('noteUp', event.data[1]);
  }
}

if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
}
