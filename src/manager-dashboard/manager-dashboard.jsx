import React from 'react';
import { Card, Button } from 'react-materialize';
import { Spinner, PeriodsModel } from '../core/components';
import * as moment from 'moment';
import * as Api from '../core/api';

const DATE_FORMAT = 'YYYY-MM-DD';

export default class ManagerDashboard extends React.Component {
  

  constructor() {
    super();
    this.state = {
    periods: [],
    isLoadingRestart: false,
    errorMessage: '',
    }
  }

  componentDidMount() {
    this.getPeriods();
  }

  async getPeriods() {
    this.setState({ periods: [] });
    const periods = await Api.get(`${Api.PERIODS_URL}`);
    const dateRanges = new PeriodsModel(periods);
    await this.setState({ periods: dateRanges });
  }
  
  async reStartPeriod(e) {
    e.preventDefault();
    if (this.state.isLoadingRestart) {
      return;
    }
    const prevPeriods = this.state.periods;
    const startOf = moment().subtract(3, 'minute').format().replace('T', ' ');

    this.setState({
      isLoadingRestart: true,
      periods:[]
    });
    try {
      const sucess = await Api.post(Api.PERIODS_URL, { startOf });
      if (!sucess) {
        this.setState({ errorMessage: 'ha habido un error ', currentPeriod: prevPeriods });
      } else  {
        await this.getPeriods();
      }
    } catch (e) {
      this.setState({ errorMessage: e.message, periods: prevPeriods });
    }
    this.setState({ isLoadingRestart: false });
    
  }

  render() {
    return <div id="manager-dashboard">
      <h1>DASHBOARD</h1>
      <div className="content row"> 
        <div className="dashbord-tile col s10 m5">
          <Card
            actions={[
              <Button disabled={this.state.isLoadingRestart}
                  key="1" onClick={(e) => { this.reStartPeriod(e) }}>
                {
                  !this.state.isLoadingRestart ?
                    <span>Nueva corrida (periodo)</span> :
                    <span>Cargando...</span>
                }
              </Button>
            ]}
            horizontal>
             { this.state.periods.length ?
             <div>Total de corridas: {this.state.periods.length}</div> :
             <Spinner/>}            
          </Card>          
        </div>
      </div>
    </div> 
  }
}