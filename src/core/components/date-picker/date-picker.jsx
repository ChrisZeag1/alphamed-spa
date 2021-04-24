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
    onSelect: (e) =>  props.onDateSelect(e)
  };

  const clearPicker = () => {
    setResetDatePicker(false);
    options = {
      ...options,
      defaultDate: (props.currentDay || moment()).toDate(),
      onSelect: (e) =>  props.onDateSelect(e)
    };

    setTimeout(() => {
      setResetDatePicker(true);
    }, 10);
  };

  const onPrevDay = async (e) => {
    e.preventDefault();
    await props.onPrevDayClick();
    clearPicker();
  };

  const onNextDay = async (e) => {
    e.preventDefault();
    await props.onNextDayClick();
    clearPicker();
  }
  

  return <div className="alpha-date-picker" aria-label="dia anterior">
    <div role="button" onClick={onPrevDay}>
      <i className="medium material-icons">chevron_left</i>
    </div>
      <div className="selector">
      {resetDatePicker && <DatePicker options={options}/>}
    </div>
    <div role="button" onClick={onNextDay}
      aria-label="dia siguente">
      <i className="medium material-icons">chevron_right</i>
    </div>
  </div>
}