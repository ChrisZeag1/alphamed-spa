import React from 'react';
import { Card } from 'react-materialize';
import { Spinner } from '../core/components';
import * as moment from 'moment';
import * as Api from '../core/api';

const DATE_FORMAT = 'YYYY-MM-DD';

export default class ManagerDashboard extends React.Component {
  

  constructor() {
    super();
    this.state = {
    currentPeriod: {
      startOf: '',
    },
    isLoadingRestart: false,
    errorMessage: '',
    }
  }

  async componentDidMount() {
    let startOfPeriod = localStorage.getItem('startOfPeriod');
    if (!startOfPeriod) {
      startOfPeriod = await Api.get(`${Api.PERIODS_URL}/latest`);
    }
    this.setState({ currentPeriod: {
      startOf: moment(startOfPeriod.split('T')[0]).format(DATE_FORMAT)
    }});
  }
  
  async reStartPeriod(e) {
    e.preventDefault();
    if (this.state.isLoadingRestart) {
      return;
    }
    const startOf = moment().format(DATE_FORMAT);
    localStorage.setItem('startOfPeriod', startOf);
    this.setState({
      isLoadingRestart: true,
      currentPeriod: {
        startOf
      }
    });
    try {
      const sucess = await Api.post(Api.PERIODS_URL, { startOf });
      if (!sucess) {
        this.setState({ errorMessage: 'ha habido un error ', currentPeriod: { startOf: null } });
      }
    } catch (e) {
      this.setState({ errorMessage: e.message, currentPeriod: { startOf: null } });
    }
    this.setState({ isLoadingRestart: false });
    
  }

  render() {
    return <div id="manager-dashboard">
      <h1>DASHBORD</h1>
      <div className="content row"> 
        <div className="dashbord-tile col s10 m5">
          <Card
            actions={[
              <a className={this.state.isLoadingRestart ? 'disabled' : ''}
                  key="1" onClick={(e) => { this.reStartPeriod(e) }}>
                { 
                  !this.state.isLoadingRestart ?
                    <span>Nueva Corrida</span> :
                    <span>Cargando...</span>
                }
              </a>
            ]}
            horizontal>
             { this.state.currentPeriod.startOf ? <div>
              Perido del 
              <span> {moment(this.state.currentPeriod.startOf).format('ll')}</span>  al
               <span> {moment().format('ll')} </span>
              </div>: <Spinner/>}            
          </Card>          
        </div>
      </div>
    </div> 
  }
}