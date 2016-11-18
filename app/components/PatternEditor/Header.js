import React from 'react';

import Button from 'components/Button';

import styles from './styles.css';

export default class Header extends React.Component {
  onSubNoteColumn(trackIndex) {
    this.props.onSetNoteColumns(trackIndex, this.props.pattern.trackdata[trackIndex].notecolumns - 1);
  }

  onAddNoteColumn(trackIndex) {
    this.props.onSetNoteColumns(trackIndex, this.props.pattern.trackdata[trackIndex].notecolumns + 1);
  }

  render() {
    const widths = this.props.pattern.trackdata.map((track) =>
      track.notecolumns * 150);

    return (
      <table id="header-table">
        <thead>
          <tr>
            { this.props.pattern && this.props.pattern.trackdata.map((track, index) => (
              <th key={index}>
                <div className={styles['track-header']} style={{ width: widths[index] }}>{track.name}
                  <div className={styles['track-color']} style={{ background: track.color }}></div>
                  <div className={styles['track-controls']}>
                    <Button callBack={() => (this.onSubNoteColumn(index))} size="sm" iconName="minus" />
                    <Button callBack={() => (this.onAddNoteColumn(index))} size="sm" iconName="plus" />
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
      </table>
    );
  }
}

Header.propTypes = {
  pattern: React.PropTypes.object,
  onSetNoteColumns: React.PropTypes.func.isRequired,
};
