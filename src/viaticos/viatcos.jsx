import React from 'react';
import * as moment from 'moment';
import {get as _get } from 'lodash';
import * as Api from '../core/api';
import { Collapsible, CollapsibleItem } from 'react-materialize';
import { Spinner, PeriodsSector, PeriodsModel } from '../core/components';
import './viaticos.scss';

export default class Viaticos extends React.Component {

  constructor() {
    super();
    this.state = {
      currentPeriod: null,
      periods: [],
      viaticos: undefined,
      errorMessage: undefined,
    };
  }
  async componentDidMount() {
    this.user = JSON.parse(localStorage.getItem('am-user'));
    await this.getPeriods();
    await this.refreshPage();
  }

  async getPeriods() {
    try {
      const periods = await Api.get(`${Api.PERIODS_URL}`);
      const dateRanges = new PeriodsModel(periods);
      const prevPeriodSelection = JSON.parse(localStorage.getItem('currentPeriod'));
      await this.setState({ periods: dateRanges, currentPeriod: prevPeriodSelection || dateRanges[0] });
    } catch(e) {
      console.error('Error al cargar los periodos >' , e);
      this.setState({errorMessage: 'Error al cargar los periodos'});
    }
  }

  async refreshPage() {
    try {
      const queryDate = `?fromDate=${this.state.currentPeriod.startDate}&toDate=${this.state.currentPeriod.endDate}`;
      const viaticos = await Api.get(`${Api.VIATICOS_URL}${queryDate}`);
      this.setState({ viaticos: Object.values(viaticos || {}) });

    } catch(e) {
      console.error('Error al cargar los viatcos > ', e);
      this.setState({errorMessage: 'Error al cargar los viatcos'});
    }
  }

  async setCurrentPeriodAndGetViaticos(currentPeriod) {
    await this.setState({ currentPeriod, viaticos: undefined });
    await this.refreshPage();
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
        <div className="filter-headers">
          {!!this.state.periods.length && <PeriodsSector
            periods={this.state.periods}
            initPeriod={this.state.currentPeriod}
            setCurrentPeriod={(currentPeriod) => this.setCurrentPeriodAndGetViaticos(currentPeriod) }>
          </PeriodsSector>}
        </div>
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