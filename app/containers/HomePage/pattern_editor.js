import React from 'react';

import '!style!css!./pattern_editor.css';

function padDigits(value, digits) {
  return Array(Math.max(digits - String(value).length + 1, 0)).join(0) + value;
}

function padEventProperty(event, item, digits) {
  if(event && event[item]) {
    return padDigits(event[item], digits);
  } else {
    return '----------'.slice(0,digits);
  }
}


function PatternEvent(props) {
  let note = '---';
  let instrument = padEventProperty(props.event, 'instrument', 2);
  let volume = padEventProperty(props.event, 'volume', 2);
  let panning = padEventProperty(props.event, 'panning', 2);
  let delay = padEventProperty(props.event, 'delay', 2);
  let fx = padEventProperty(props.event, 'fx', 4);
  if(props.event){
    if(props.event.note) {
      if(props.event.note.length === 3) {
        note = props.event.note;
      } else {
        note = [props.event.note.slice(0,1), '-', props.event.note.slice(1)].join('');
      }
    }
  }
  return (
    <div className="line">
      <div className="note">{ note }</div>
      <div className="instrument">{ instrument }</div>
      <div className="volume">{ volume }</div>
      <div className="panning">{ panning }</div>
      <div className="delay">{ delay }</div>
      <div className="fx">{ fx }</div>
    </div>
  );
};


export default class PatternEditor extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.song = {
      tracks: [
        { name: 'Track 1' },
        { name: 'Track 2' },
        { name: 'Track 3' },
        { name: 'Track 4' },
        { name: 'Track 5' },
        { name: 'Track 6' },
      ],
      instruments: [
      ],
      patterns: [{
        rows: 64,
        trackdata: [
          [
  /* 00 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 01 */ {},
  /* 02 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 03 */ {},
  /* 04 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 05 */ {},
  /* 06 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 07 */ {},
  /* 08 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 09 */ {},
  /* 0A */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 0B */ {},
  /* 0C */ { note: 'D5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 0D */ {},
  /* 0E */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 0F */ {},
  /* 10 */ { note: 'A2', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 11 */ {},
  /* 12 */ {},
  /* 13 */ {},
  /* 14 */ {},
  /* 15 */ {},
  /* 16 */ {},
  /* 17 */ {},
  /* 18 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 19 */ {},
  /* 1A */ {},
  /* 1B */ {},
  /* 1C */ { note: 'E2', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 1D */ {},
  /* 1E */ {},
  /* 1F */ {},
  /* 20 */ {},
  /* 21 */ {},
  /* 22 */ {},
  /* 23 */ {},
  /* 24 */ { note: 'G#4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 25 */ {},
  /* 26 */ {},
  /* 27 */ {},
  /* 28 */ { note: 'A2', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 29 */ {},
  /* 2A */ {},
  /* 2B */ {},
  /* 2C */ {},
  /* 2D */ {},
  /* 2E */ {},
  /* 2F */ {},
  /* 30 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 31 */ {},
  /* 32 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 33 */ {},
  /* 34 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 35 */ {},
  /* 36 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 37 */ {},
  /* 38 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 39 */ {},
  /* 3A */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 3B */ {},
  /* 3C */ { note: 'D5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 3D */ {},
  /* 3E */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 3F */ {},
          ],
          [
  /* 00 */ {},
  /* 01 */ {},
  /* 02 */ {},
  /* 03 */ {},
  /* 04 */ {},
  /* 05 */ {},
  /* 06 */ {},
  /* 07 */ {},
  /* 08 */ {},
  /* 09 */ {},
  /* 0A */ {},
  /* 0B */ {},
  /* 0C */ {},
  /* 0D */ {},
  /* 0E */ {},
  /* 0F */ {},
  /* 10 */ { note: 'A4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 11 */ {},
  /* 12 */ {},
  /* 13 */ {},
  /* 14 */ { note: 'A3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 15 */ {},
  /* 16 */ {},
  /* 17 */ {},
  /* 18 */ {},
  /* 19 */ {},
  /* 1A */ { note: 'A4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 1B */ {},
  /* 1C */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 1D */ {},
  /* 1E */ {},
  /* 1F */ {},
  /* 20 */ { note: 'G#3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 21 */ {},
  /* 22 */ {},
  /* 23 */ {},
  /* 24 */ {},
  /* 25 */ {},
  /* 26 */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 27 */ {},
  /* 28 */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 29 */ {},
  /* 2A */ {},
  /* 2B */ {},
  /* 2C */ { note: 'A3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 2D */ {},
  /* 2E */ {},
  /* 2F */ {},
  /* 30 */ {},
  /* 31 */ {},
  /* 32 */ {},
  /* 33 */ {},
  /* 34 */ {},
  /* 35 */ {},
  /* 36 */ {},
  /* 37 */ {},
  /* 38 */ {},
  /* 39 */ {},
  /* 3A */ {},
  /* 3B */ {},
  /* 3C */ {},
  /* 3D */ {},
  /* 3E */ {},
  /* 3F */ {},
          ],
          [
  /* 00 */ {},
  /* 01 */ {},
  /* 02 */ {},
  /* 03 */ {},
  /* 04 */ {},
  /* 05 */ {},
  /* 06 */ {},
  /* 07 */ {},
  /* 08 */ {},
  /* 09 */ {},
  /* 0A */ {},
  /* 0B */ {},
  /* 0C */ {},
  /* 0D */ {},
  /* 0E */ {},
  /* 0F */ {},
  /* 10 */ {},
  /* 11 */ {},
  /* 12 */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 13 */ {},
  /* 14 */ {},
  /* 15 */ {},
  /* 16 */ {},
  /* 17 */ {},
  /* 18 */ {},
  /* 19 */ {},
  /* 1A */ {},
  /* 1B */ {},
  /* 1C */ { /* Stop */ },
  /* 1D */ {},
  /* 1E */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 1F */ {},
  /* 20 */ {},
  /* 21 */ {},
  /* 22 */ {},
  /* 23 */ {},
  /* 24 */ {},
  /* 25 */ {},
  /* 26 */ {},
  /* 27 */ {},
  /* 28 */ { /* Stop */ },
  /* 29 */ {},
  /* 2A */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 2B */ {},
  /* 2C */ {},
  /* 2D */ {},
  /* 2E */ {},
  /* 2F */ {},
  /* 30 */ {},
  /* 31 */ {},
  /* 32 */ { /* Stop */ },
  /* 33 */ {},
  /* 34 */ {},
  /* 35 */ {},
  /* 36 */ {},
  /* 37 */ {},
  /* 38 */ {},
  /* 39 */ {},
  /* 3A */ {},
  /* 3B */ {},
  /* 3C */ {},
  /* 3D */ {},
  /* 3E */ {},
  /* 3F */ {},
          ],
          [
  /* 00 */ {},
  /* 01 */ {},
  /* 02 */ {},
  /* 03 */ {},
  /* 04 */ {},
  /* 05 */ {},
  /* 06 */ {},
  /* 07 */ {},
  /* 08 */ {},
  /* 09 */ {},
  /* 0A */ {},
  /* 0B */ {},
  /* 0C */ {},
  /* 0D */ {},
  /* 0E */ {},
  /* 0F */ {},
  /* 10 */ {},
  /* 11 */ {},
  /* 12 */ {},
  /* 13 */ {},
  /* 14 */ {},
  /* 15 */ {},
  /* 16 */ { note: 'C4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 17 */ {},
  /* 18 */ {},
  /* 19 */ {},
  /* 1A */ {},
  /* 1B */ {},
  /* 1C */ { /* Stop */ },
  /* 1D */ {},
  /* 1E */ {},
  /* 1F */ {},
  /* 20 */ {},
  /* 21 */ {},
  /* 22 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 23 */ {},
  /* 24 */ {},
  /* 25 */ {},
  /* 26 */ {},
  /* 27 */ {},
  /* 28 */ { /* Stop */ },
  /* 29 */ {},
  /* 2A */ {},
  /* 2B */ {},
  /* 2C */ {},
  /* 2D */ {},
  /* 2E */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  /* 2F */ {},
  /* 30 */ {},
  /* 31 */ {},
  /* 32 */ { /* Stop */ },
  /* 33 */ {},
  /* 34 */ {},
  /* 35 */ {},
  /* 36 */ {},
  /* 37 */ {},
  /* 38 */ {},
  /* 39 */ {},
  /* 3A */ {},
  /* 3B */ {},
  /* 3C */ {},
  /* 3D */ {},
  /* 3E */ {},
  /* 3F */ {},
          ],
          [
  /* 00 */ {},
  /* 01 */ {},
  /* 02 */ {},
  /* 03 */ {},
  /* 04 */ {},
  /* 05 */ {},
  /* 06 */ {},
  /* 07 */ {},
  /* 08 */ {},
  /* 09 */ {},
  /* 0A */ {},
  /* 0B */ {},
  /* 0C */ {},
  /* 0D */ {},
  /* 0E */ {},
  /* 0F */ {},
  /* 10 */ {},
  /* 11 */ {},
  /* 12 */ {},
  /* 13 */ {},
  /* 14 */ {},
  /* 15 */ {},
  /* 16 */ {},
  /* 17 */ {},
  /* 18 */ {},
  /* 19 */ {},
  /* 1A */ {},
  /* 1B */ {},
  /* 1C */ {},
  /* 1D */ {},
  /* 1E */ {},
  /* 1F */ {},
  /* 20 */ {},
  /* 21 */ {},
  /* 22 */ {},
  /* 23 */ {},
  /* 24 */ {},
  /* 25 */ {},
  /* 26 */ {},
  /* 27 */ {},
  /* 28 */ {},
  /* 29 */ {},
  /* 2A */ {},
  /* 2B */ {},
  /* 2C */ {},
  /* 2D */ {},
  /* 2E */ {},
  /* 2F */ {},
  /* 30 */ {},
  /* 31 */ {},
  /* 32 */ {},
  /* 33 */ {},
  /* 34 */ {},
  /* 35 */ {},
  /* 36 */ {},
  /* 37 */ {},
  /* 38 */ {},
  /* 39 */ {},
  /* 3A */ {},
  /* 3B */ {},
  /* 3C */ {},
  /* 3D */ {},
  /* 3E */ {},
  /* 3F */ {},
          ],
          [
  /* 00 */ {},
  /* 01 */ {},
  /* 02 */ {},
  /* 03 */ {},
  /* 04 */ {},
  /* 05 */ {},
  /* 06 */ {},
  /* 07 */ {},
  /* 08 */ {},
  /* 09 */ {},
  /* 0A */ {},
  /* 0B */ {},
  /* 0C */ {},
  /* 0D */ {},
  /* 0E */ {},
  /* 0F */ {},
  /* 10 */ {},
  /* 11 */ {},
  /* 12 */ {},
  /* 13 */ {},
  /* 14 */ {},
  /* 15 */ {},
  /* 16 */ {},
  /* 17 */ {},
  /* 18 */ {},
  /* 19 */ {},
  /* 1A */ {},
  /* 1B */ {},
  /* 1C */ {},
  /* 1D */ {},
  /* 1E */ {},
  /* 1F */ {},
  /* 20 */ {},
  /* 21 */ {},
  /* 22 */ {},
  /* 23 */ {},
  /* 24 */ {},
  /* 25 */ {},
  /* 26 */ {},
  /* 27 */ {},
  /* 28 */ {},
  /* 29 */ {},
  /* 2A */ {},
  /* 2B */ {},
  /* 2C */ {},
  /* 2D */ {},
  /* 2E */ {},
  /* 2F */ {},
  /* 30 */ {},
  /* 31 */ {},
  /* 32 */ {},
  /* 33 */ {},
  /* 34 */ {},
  /* 35 */ {},
  /* 36 */ {},
  /* 37 */ {},
  /* 38 */ {},
  /* 39 */ {},
  /* 3A */ {},
  /* 3B */ {},
  /* 3C */ {},
  /* 3D */ {},
  /* 3E */ {},
  /* 3F */ {},
          ],
        ],
      }],
    };

    this.onScroll = this.onScroll.bind(this);

    this.yoff = 0;
  }

  onScroll(e) {
    var vert_target = document.getElementById("sideTable");
    var horiz_target = document.getElementsByClassName("xscroll")[0];
    var col1 = document.getElementById("col1");

    this.yoff += e.deltaY;
    vert_target.scrollTop = Math.round((this.yoff)/15.0)*15.0;

    horiz_target.scrollLeft += e.deltaX;
    col1.scrollTop = vert_target.scrollTop;
    e.preventDefault();
  }

  rowClassNames(row, cursorLine, rowsPerBeat) {
    let names = ['row'];

    if(row % rowsPerBeat === 0) {
      names.push('beat-row');
    }
    return names.join(' ');
  }

  render() {
    const width = parseInt(this.props.width.slice(0,-2));
    const height = parseInt(this.props.height.slice(0,-2));
    const scrollHeight = (Math.ceil((height-48)/15.0)-1)*15.0;

    const visibleLines = scrollHeight/15;
    console.log(visibleLines);
    const cursorLine = Math.round(visibleLines/2);
    console.log(cursorLine);

    return (
      <div className="widget-container">
        <div className="pattern-cursor" style={{ width: width-22, height: '15px', position: 'absolute', top: 10 + 26 + (cursorLine*15) }}>
        </div>
        <div className='pattern-editor'>
          <div style={{float: 'left'}}>
            <div>
              <table>
                <thead>
                  <tr>
                    <th className="tick"><div className="time-header"><br/></div></th>
                  </tr>
                </thead>
              </table>
            </div>

            <div id='col1' style={{height: scrollHeight}}>
              <table>
                <tbody>
                  { [...Array(this.song.patterns[0].rows)].map((x, row) => (
                    <tr key={row} className={ this.rowClassNames(row, cursorLine, 4) }>
                      <th className='tick'>{ padDigits(row, 2) }</th>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{float: 'left'}} className='xscroll' style={{width: width - 63}}>
            <div id='leftSideTable'>
              <table>
                <thead>
                  <tr>
                    { this.song.tracks && this.song.tracks.map((track, index) => (
                      <th key={index}><div className='track-header'>{track.name}</div></th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
            <div style={{height: scrollHeight}} id='sideTable' onWheel={this.onScroll}>
              <table>
                <tbody>
                  { [...Array(this.song.patterns[0].rows)].map((x, row) => (
                    <tr key={row} className={ this.rowClassNames(row, cursorLine, 4) }>
                      { this.song.patterns[0] && this.song.patterns[0].trackdata.map((track, index) => (
                        <td key={index}><PatternEvent key={index} event={track[row]} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

