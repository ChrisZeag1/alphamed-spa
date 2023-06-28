import React, { useState } from 'react';
import * as moment from 'moment'; 
import './periods-selector.scss';

export const PeriodsSector = (props) => {
  const dateRanges = props.periods;
  const lastRangeIndex = dateRanges.length - 1;
  const defaultIndex = props.initPeriod ?
    dateRanges.findIndex(r => r.startDate == props.initPeriod.startDate && r.endDate == props.initPeriod.endDate) : 0;
  const [currentRangeIndex, setcurrentRangeIndex] = useState(defaultIndex > -1 ? defaultIndex : 0);

  const onPrev = () => {
    setcurrentRangeIndex(currentRangeIndex - 1);
    localStorage.setItem('currentPeriod', JSON.stringify(dateRanges[currentRangeIndex - 1]));
    props.setCurrentPeriod(dateRanges[currentRangeIndex - 1]);
  };

  const onNext = () => {
    setcurrentRangeIndex(currentRangeIndex + 1);
    localStorage.setItem('currentPeriod', JSON.stringify(dateRanges[currentRangeIndex + 1]));
    props.setCurrentPeriod(dateRanges[currentRangeIndex + 1]);
  };


  return (<div id="periods-selector-main">
    <div className={`period-select ${currentRangeIndex < lastRangeIndex ? '': 'arrow-hidden'}`} role="button" onClick={() => onNext()}
      aria-label="periodo siguiente" title="periodo siguiente">
      <i className="medium material-icons">chevron_left</i>
    </div>

    <h5 className="dates">

      <span className="date-time">
        <span>{moment(dateRanges[currentRangeIndex].startDate).format('DD/MM/YY')}</span>
        <span className="time">({moment(dateRanges[currentRangeIndex].startDate).format('hh:mm a')})</span>
      </span>

      <span aria-label="a">-</span>

      <span className="date-time">
        <span>{moment(dateRanges[currentRangeIndex].endDate).format('DD/MM/YY')}</span>
        <span className="time">({moment(dateRanges[currentRangeIndex].endDate).format('hh:mm a')})</span>
      </span>

    </h5>

    <div className={`period-select ${!!currentRangeIndex ? '': 'arrow-hidden'}`} role="button"
      onClick={() => onPrev()}
      aria-label="periodo anterior">
      <i className="medium material-icons">chevron_right</i>
    </div>
  </div>);
};