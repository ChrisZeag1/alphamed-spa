import React from 'react';
import * as moment from 'moment';
import {get as _get } from 'lodash';
import * as Api from '../core/api';
import { Collapsible, CollapsibleItem, Button, DatePicker } from 'react-materialize';
import { datePickerOptions } from '../core/components/date-picker/date-picker-options';
import { Spinner } from '../core/components';
import './viaticos.scss';

export default class Viaticos extends React.Component {
  datePickerStartOptions = {};
  datePickerEndOptions = {};
  selectedStartDate = '';
  selectedEndDate = '';
  defaultStartDate = moment('2020-11-29').startOf('day').format('YYYY-MM-DD HH:mm:ss');
  defaultEndDate = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');

  constructor() {
    super();
    this.state = {
      showDatePickers: true,
      fromDate: this.defaultStartDate,
      toDate: this.defaultEndDate,
      viaticos: undefined
    };
    this.datePickerStartOptions = {
      ...datePickerOptions,
      defaultDate: new Date(this.state.fromDate),
      onSelect: (e) => this.onStartDateChange(e)
    };
    this.datePickerEndOptions = {
      ...datePickerOptions,
      defaultDate: new Date(this.state.toDate),
      onSelect: (e) => this.onEndDateChange(e)
    };
  }
  async componentDidMount() {
    this.user = JSON.parse(localStorage.getItem('am-user'));
    await this.getPeriod();
    await this.refreshPage();
    document.querySelectorAll('.datepicker-done').forEach((el) => {
      el.addEventListener('click', this.onDoneDate.bind(this), null);
    });
  }

  async getPeriod() {
    let startOfPeriod = await Api.get(`${Api.PERIODS_URL}/latest`);
    if (!startOfPeriod) {
      startOfPeriod = localStorage.getItem('startOfPeriod');
    }
    this.defaultStartDate = moment(startOfPeriod).format('YYYY-MM-DD HH:mm:ss');
    await this.resetDatesToDefault();
    await this.setState({
      showDatePickers: true,
    });
  }

  async refreshPage() {
    const queryDate = `?fromDate=${this.state.fromDate}&toDate=${this.state.toDate}`;
    const viaticos = await Api.get(`${Api.VIATICOS_URL}${queryDate}`);
    console.log('viaticos >>', viaticos);
    this.setState({ viaticos: Object.values(viaticos || {}) });
  }

  async onDoneDate() {
    if(this.selectedStartDate) {
      await this.setState({ fromDate: this.selectedStartDate, showResetFilter: true });
      this.selectedStartDate = '';
      this.refreshPage();
    } else if (this.selectedEndDate) {
      await this.setState({ toDate: this.selectedEndDate, showResetFilter: true });
      this.selectedEndDate = '';
      this.refreshPage();
    }
  }  

  componentWillUnmount() {
    document.querySelectorAll('.datepicker-done').forEach((el) => {
      el.removeEventListener('click', this.onDoneDate.bind(this), null);
    });
  }

  onStartDateChange(date) {
    this.selectedStartDate = moment(date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
  }

  onEndDateChange(date) {
    this.selectedEndDate = moment(date).endOf('day').format('YYYY-MM-DD HH:mm:ss');
  }

  async resetDatesToDefault(e) {
    if (e) {
      e.preventDefault();
    }
    this.datePickerStartOptions = {
      ...this.datePickerStartOptions,
      defaultDate: new Date(this.defaultStartDate),
    };
    this.datePickerEndOptions = {
      ...this.datePickerEndOptions,
      defaultDate: new Date(this.defaultEndDate),
    };
    await this.setState({
      fromDate: this.defaultStartDate,
      toDate: this.defaultEndDate,
      showResetFilter: false,
      showDatePickers: false,
    });
  }

  async resetDatesToDefaultAndRefresh() {
    await this.resetDatesToDefault();
    await this.setState({
      showDatePickers: true,
    });
    await this.refreshPage();
    document.querySelectorAll('.datepicker-done').forEach((el) => {
      el.removeEventListener('click', this.onDoneDate.bind(this), null);
      el.addEventListener('click', this.onDoneDate.bind(this), null);
    });
  }

  getEmployeeHeader(empViaticos) {
    return <div className="employee-header-sumary">
      <div className="to-left"><b>{empViaticos[0].userName}</b></div>
      <div className="to-right">
        <div className="sumary-el s-w"> {empViaticos.length} V</div>
        <div className="sumary-el ll-w">
          <b>$ {empViaticos.reduce((acc, v) => acc + v.total, 0).toFixed(2)} MXN</b>
        </div>
      </div>
    </div>
  }

  getEmployeeViaticoHeader(viatico) {
    return <div className="employee-header-sumary">
      <div className="to-left">
        <div className="sumary-el s-w">ID: {viatico.viaticoId}</div>
        <div className="sumary-el ll-w">{moment(viatico.fecha).format('ll')} {moment(viatico.fecha).format('LT')}</div>
      </div>
      <div className="to-right">
        <div className="sumary-el ll-w">$ {viatico.total.toFixed(2)} MXN</div>
      </div>
    </div>
  }

  message() {
    return <React.Fragment>
      {
        this.state.errorMessage && <div  id="error-message" className="red accent-4 error-msg col s10 message">
         {this.state.errorMessage}
        </div>
      }
      {
        this.state.successMessage && <div  id="sucess-message" className="teal accent-4 success-msg col s10 message">
          {this.state.successMessage}
        </div>
      }
    </React.Fragment>
  }

  render() {
    return <div id="viaticos">
      <div className="viaticos__header">
        <h1>Viaticos</h1>
        <h5>Viendo desde </h5>
        {this.state.showDatePickers && <DatePicker options={this.datePickerStartOptions}/>}
        a 
        {this.state.showDatePickers && <DatePicker options={this.datePickerEndOptions}/>}
        {
          this.state.showResetFilter &&
            <a className="reset-btn" onClick={(e) => this.resetDatesToDefaultAndRefresh(e) }>Clear</a>
        }
      </div>
      <div className="row">
        {this.message()}
        <div className="viaticos col s12 m10">
          { !this.state.viaticos ? <Spinner/> : this.state.viaticos.length === 0 ? <h6>No hay viaticos</h6> : <Collapsible popout accordion={false} className="main-header">
            {this.state.viaticos.map((empViaticos, uIndex) => (
              <CollapsibleItem
                key={empViaticos.userName + uIndex}
                header={this.getEmployeeHeader(empViaticos)}
                node="div"
                expanded={true}>
                  <Collapsible popout>
                    {empViaticos.map((v, vi) => <CollapsibleItem
                      header={this.getEmployeeViaticoHeader(v)}
                      key={v.viaticoId + vi}>
                        <div className="content">
                          <div><b>lugar:</b>{v.lugar}</div>
                          <div><b>concepto:</b> {v.concepto}</div>
                        </div>
                    </CollapsibleItem>)}
                  </Collapsible>
              </CollapsibleItem>
            ))}
          </Collapsible>}
        </div>
      </div>
    </div>
  }
  
}