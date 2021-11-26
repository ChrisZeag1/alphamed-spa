import React from 'react';
import { Collapsible,  CollapsibleItem } from 'react-materialize';
import  * as moment from  'moment';
import * as Api from '../core/api';
import { Spinner, AlphaDatePicker, SalesForm } from '../core/components';
import { get as _get } from 'lodash';
import './mis-ventas.scss';

export default class MisVentas extends React.Component {
  userName = '';
  selectedCalendarDay; // moment

  constructor() {
    super();
    this.state = {
      mySalesByDay: undefined,
      inventario: undefined,
      errorMessage: '',
      currentDay: moment(),
    }
  }

  async componentDidMount() {
    this.userName = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
    await this.getSales();
    await this.getInvetorio();
    setTimeout(() => {
      const el = document.querySelectorAll('button.datepicker-done')[0];
      el.addEventListener('click', this.onDoneDate.bind(this), null);
    }, 0)
  }

  componentWillUnmount() {
    const el = document.querySelectorAll('button.datepicker-done')[0];
    el.removeEventListener('click', this.onDoneDate.bind(this), null);
  }

  async getSales() {
    const current = this.state.currentDay.format('YYYY-MM-DD');
    const startOfWeek = moment(current).startOf('day').startOf('week').format('YYYY-MM-DD HH:mm:ss');
    const endOfWeek = moment(current).endOf('day').endOf('week').format('YYYY-MM-DD HH:mm:ss');
    const queryWeek = `fromDate=${startOfWeek}&toDate=${endOfWeek}`;

    try {
      const sales = await Api.get(`${Api.VENTAS_URL}/${this.userName}?${queryWeek}`);
      const mySalesByDay = sales
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
        }))
        .reduce((acc, sale) => {
          const saleDate = moment(sale.fechaVenta).format('YYYY-MM-DD');
          acc[saleDate] = (acc[saleDate] || []).concat(sale);
          return acc;
        }, {});
      await this.setState({ mySalesByDay });
    } catch(e) {
      this.setState({ errorMessage: 'Hubo un problema al obtener tus ventas.' });
      console.error(e);
    }
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

  updateOnDoneEvent() {
    setTimeout(()=> {
      const el = document.querySelectorAll('.datepicker-done')[0];
      el.removeEventListener('click', this.onDoneDate.bind(this), null);
      el.addEventListener('click', this.onDoneDate.bind(this), null);
    }, 100);
  }

  async onPrevDayClick() {
    const prevDay = moment(this.state.currentDay).subtract(1, 'day');
    await this.updateSalesOnDay(prevDay);
    this.updateOnDoneEvent();
  }

  async onNextDayClick() {
    const nextDay = moment(this.state.currentDay).add(1, 'day');
    await this.updateSalesOnDay(nextDay);
    this.updateOnDoneEvent();
  }

  async onDoneDate() {
    await this.updateSalesOnDay(this.selectedCalendarDay || this.state.currentDay);
    this.selectedCalendarDay = undefined;
    this.updateOnDoneEvent();
  }

  onDateSelect(day) {
    this.selectedCalendarDay = moment(day);
  }

  async updateSalesOnDay(day) {
    const endOfWeek = moment(this.state.currentDay).endOf('week');
    const startOfWeek = moment(this.state.currentDay).startOf('week');
    await this.setState({ currentDay: day });
    if (day <= startOfWeek || day >= endOfWeek) {
      await this.getSales();
    }
  }

  getSalesHeader(sale) {
    return <div className="employee-header-sumary">
      <div className="sale-summary-info between">
        <div className="sumary-el">ID: {sale.ventaId}</div>
        <div className="sumary-el main">{moment(sale.fechaVenta).format('ll')}</div>
      </div>
      <div className="sale-summary-info end">
        <div className="sumary-el">{sale.articulos.length} U</div>
        <div className="sumary-el money">$ {sale.subTotal} MXN</div>
      </div>
    </div>
  }

  render() {
    const cday = this.state.currentDay.format('YYYY-MM-DD'); 
    return <div id="my-sales">
      <div className="sales__header">
        <h1>Mis ventas</h1>
        <div className="filter-headers">
          <AlphaDatePicker onPrevDayClick={this.onPrevDayClick.bind(this)}
                           onDateSelect={this.onDateSelect.bind(this)}
                           currentDay={this.state.currentDay}
                           onNextDayClick={this.onNextDayClick.bind(this)}>
            </AlphaDatePicker>
        </div>
      </div>
      {
        this.state.mySalesByDay ? <div className="row">
          <Collapsible popout>
            {
              !this.state.mySalesByDay[cday] || !this.state.mySalesByDay[cday].length ?
                <h5 className="text-centered"> Sin resultados</h5> :
                this.state.mySalesByDay[cday].map(empSale =>
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
