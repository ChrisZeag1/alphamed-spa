import * as moment from 'moment'
import React, { useState } from 'react';
import { DatePicker } from 'react-materialize';
import { datePickerOptions } from './date-picker-options';
import './date-picker.scss';

export const AlphaDatePicker = (props) => {
  const [resetDatePicker, setResetDatePicker] = useState(true);
  let options = {
    ...datePickerOptions,
    ...(props.datePickerOptions || {}),
    defaultDate: (props.currentDay || moment()).toDate(),
    onSelect: props.onDateSelect
  };

  const clearPicker = () => {
    setResetDatePicker(false);
    console.log('props.currentDay >>', props.currentDay.day());
    options = {
      ...options,
      defaultDate: (props.currentDay || moment()).toDate(),
    };

    setTimeout(() => {
      setResetDatePicker(true);
    }, 10);
  }
  

  return <div className="alpha-date-picker" aria-label="dia anterior">
    <div role="button" onClick={() => { props.prevDay();clearPicker(); }}>
      <i className="medium material-icons">chevron_left</i>
    </div>
      <div className="selector">
      {resetDatePicker && <DatePicker options={options}/>}
    </div>
    <div role="button" onClick={() => { props.nextDay();clearPicker(); } } aria-label="dia siguente">
      <i className="medium material-icons">chevron_right</i>
    </div>
  </div>
}