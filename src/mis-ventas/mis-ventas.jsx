import React from 'react';
import { Collapsible,  CollapsibleItem } from 'react-materialize';
import  * as moment from  'moment';
import * as Api from '../core/api';
import { Spinner, PeriodsSector, SalesForm, PeriodsModel } from '../core/components';
import { get as _get } from 'lodash';
import { totales } from '../ventas/totales';
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
      totalViaticos: null,
      totalEfectivoDisponible: 0
    }
  }

  async componentDidMount() {
    this.userName = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
    await this.getPeriods();
    await this.getSales();
    await this.getInvetorio();
    this.getTotalViaticos();
  }

  async getPeriods() {
    try {
      const periods = await Api.get(`${Api.PERIODS_URL}`);
      const dateRanges = new PeriodsModel(periods);
      const prevPeriodSelection = JSON.parse(localStorage.getItem('currentPeriod'));
      await this.setState({ periods: dateRanges, currentPeriod: prevPeriodSelection || dateRanges[0] });
    } catch(e) {
      this.setState({ errorMessage: 'Hubo un problema al obtener las corridas' });
      console.error(e);
    }
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

  async getTotalViaticos() {
    try {
      const queryDate = `?fromDate=${this.state.currentPeriod.startDate}&toDate=${this.state.currentPeriod.endDate}`;
      const viaticos = await Api.get(`${Api.VIATICOS_URL}/${this.userName}${queryDate}`);
      const totalViaticos = viaticos
        .reduce((acc, viatico) => (
          acc + viatico.total
        ), 0);
        const totalEfectivoDisponible = totales.getByMetodos(this.state.mySales)
          .find(m => m.metodo === 'Efectivo').total - totalViaticos;
      await this.setState({ totalViaticos, totalEfectivoDisponible });
    } catch(e) {
      this.setState({ errorMessage: 'Hubo un problema al obtener los viaticos.' });
      console.error(e);
    }
  }

  async setCurrentPeriodAndGetNewSales(currentPeriod) {
    await this.setState({ currentPeriod, mySales: undefined });
    await this.getSales();
    this.getTotalViaticos();
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
            initPeriod={this.state.currentPeriod}
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
      <div className="summary-section">
        <h3>Resumen</h3>
        {this.state.mySales ? this.state.mySales.length === 0 ? <h5 className="text-centered">No hay ventas </h5> : <div className="totals row">
        <ul className="collection with-header col s12 m3">
          <li className="collection-header bluish"><h5>Total de Ventas</h5></li>
          <li className="collection-item">
            <p><b>Ventas sin IVA:</b> <span>$ {totales.getSinIva(this.state.mySales).toFixed(2)}</span></p>
          </li>
          <li className="collection-item">
            <p><b>Ventas con IVA: </b> <span>$ {totales.getConIva(this.state.mySales).toFixed(2)}</span></p>
          </li>
        </ul>
        <ul className="collection with-header col s12 m3">
          <li className="collection-header bluish"><h5>Total por método de pago</h5></li>
          {totales.getByMetodos(this.state.mySales).map((metodoTotal, i) => (
            <li className="collection-item" key={i + '-metodo'}>
              <p><b>{metodoTotal.metodo}: </b> <span>$ {metodoTotal.total.toFixed(2)}</span></p>
            </li>
          ))}
        </ul>
        {this.state.totalViaticos === undefined ? <Spinner/> :
          <ul className="collection with-header col s12 m3">
            <li className="collection-header bluish"><h5>Total</h5></li>
            <li className="collection-item">
              <p><b>Viáticos usados: </b> <span>$ {this.state.totalViaticos}</span></p>
            </li>
            <li className="collection-item">
              <p><b>Efectivo Disponible: </b> <span>$ {this.state.totalEfectivoDisponible}</span></p>
            </li>
          </ul>}
      </div> : <Spinner/>}
      </div> 
    </div>
  }
}
