import React from 'react';
import { Collapsible,  CollapsibleItem } from 'react-materialize';
import  * as moment from  'moment';
import * as Api from '../core/api';
import { Spinner, PeriodsSector, SalesForm, PeriodsModel } from '../core/components';
import { get as _get } from 'lodash';
import './mis-ventas.scss';

export default class MisVentas extends React.Component {
  userName = '';
  selectedCalendarDay; // moment

  constructor() {
    super();
    this.state = {
      mySales: undefined,
      inventario: undefined,
      errorMessage: '',
      periods: [],
      currentPeriod: {
        startDate: null,
        endDate: null
      },
    }
  }

  async componentDidMount() {
    this.userName = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
    await this.getPeriods();
    await this.getSales();
    await this.getInvetorio();
  }

  async getPeriods() {
    const periods = await Api.get(`${Api.PERIODS_URL}`);
    const dateRanges = new PeriodsModel(periods);
    await this.setState({ periods: dateRanges, currentPeriod: dateRanges[0] });
  }

  async getSales() {
    const queryWeek = `fromDate=${this.state.currentPeriod.startDate}&toDate=${this.state.currentPeriod.endDate}`;

    try {
      const sales = await Api.get(`${Api.VENTAS_URL}/${this.userName}?${queryWeek}`);
      const mySales = sales
        .map(sale => ({
          IVA: sale.IVA,
          fechaVenta: sale.fechaVenta,
          articulos: [...sale.articulos],
          subTotal: sale.subTotal,
          total: sale.total,
          userName: sale.userName,
          ventaId: sale.ventaId,
          form: {
            isReadMode: true,
            nombreDoctor: sale.nombreDoctor,
            metodoPago: sale.metodoPago,
            facturaEmail: sale.facturaEmail,
            nota: sale.nota,
            rfc: sale.rfc
          }
        }));
      await this.setState({ mySales });
    } catch(e) {
      this.setState({ errorMessage: 'Hubo un problema al obtener tus ventas.' });
      console.error(e);
    }
  }

  async setCurrentPeriodAndGetNewSales(currentPeriod) {
    await this.setState({ currentPeriod, mySales: undefined });
    await this.getSales();
  }

  async getInvetorio() {
    try {
      const inventario = await Api.get(Api.INVENTARIO_URL + `/${this.userName}`);
      this.setState({
        inventario,
        errorMessage: ''
      });
    } catch(e) {
      this.setState({ errorMessage: 'Hubo un problema al obtener tu invetario.' });
      console.error(e);
    }
  }

  getSalesHeader(sale) {
    return <div className="employee-header-sumary">
      <div className="sale-summary-info between">
        <div className="sumary-el">ID: {sale.ventaId}</div>
        <div className="sumary-el main">{moment(sale.fechaVenta).format('ll')}</div>
      </div>
      <div className="sale-summary-info end">
        <div className="sumary-el">{sale.articulos.length} Pzas</div>
        <div className="sumary-el money">$ {sale.subTotal} MXN</div>
      </div>
    </div>
  }

  render() {
    return <div id="my-sales">
      <div className="sales__header">
        <h1>Mis ventas</h1>
        <div className="filter-headers">
          {!!this.state.periods.length && <PeriodsSector
            periods={this.state.periods}
            setCurrentPeriod={(currentPeriod) => this.setCurrentPeriodAndGetNewSales(currentPeriod) }>
          </PeriodsSector>}
        </div>
      </div>
      {
        this.state.mySales ? <div className="row">
          <Collapsible popout>
            {
              !this.state.mySales || !this.state.mySales.length ?
                <h5 className="text-centered"> Sin resultados</h5> :
                this.state.mySales.map(empSale =>
                  <CollapsibleItem key={empSale.ventaId}
                    header={this.getSalesHeader(empSale)}>
                      <SalesForm {...empSale} inventario={this.state.inventario}></SalesForm>
                  </CollapsibleItem>) 
            }
          </Collapsible>
          </div> : <Spinner/>
      }
    </div>
  }
}
