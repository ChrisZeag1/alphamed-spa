import React from 'react';
import { Collapsible,  CollapsibleItem, Button } from 'react-materialize';
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
      totalEfectivoDisponible: 0,
      updatingSaleForm: null
    }
  }

  async componentDidMount() {
    this.userName = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
    await this.refreshPage();
  }

  async refreshPage() {
    await this.setState({
      mySales: undefined,
      inventario: undefined,
      errorMessage: '',
      periods: [],
      currentPeriod: {
        startDate: null,
        endDate: null
      },
      totalViaticos: null,
      totalEfectivoDisponible: 0,
      updatingSaleForm: null
    });
    await this.getPeriods();
    await this.getSales();
    await this.getInvetorio();
    await this.getTotalViaticos();
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

  async onSaleEdit(e, userName, ventaId) {
    e.preventDefault();
    const errors = [];
    if (!this.state.updatingSaleForm.articulos.length) {
      errors.push('No hay articulos para vender');
    }
    if (this.state.updatingSaleForm.articulos.some(a => !a.cantidad)) {
      errors.push('Existen articulos sin cantidad asignada');
    }
    if (!this.state.updatingSaleForm.form.metodoPago) {
      errors.push('Falta agregar el método de pago');
    }
    if (errors.length) {
      this.displayMessage({ errorMessage: errors.join(',  ')});
      window.scroll({ top: 0,  behavior: 'smooth' });
      return;
    }
    const toBeSaved = {
      ...this.state.updatingSaleForm.form,
      articulos: this.state.updatingSaleForm.articulos.filter(a => a.articuloId),
      subTotal: +(this.state.updatingSaleForm.subTotal.toFixed(2)),
      total: +(this.state.updatingSaleForm.total.toFixed(2)),
      IVA: this.state.updatingSaleForm.IVA,
      fechaVenta: this.state.updatingSaleForm.fechaVenta
    };

    try {
      const response = await Api.post(`${Api.VENTAS_URL}/${userName}/${ventaId}`, toBeSaved);
      if (response && response.ventaId) {
        this.refreshPage();
        this.displayMessage({ successMessage: `La venta con id ${ventaId} de ${userName} ha sido editada`});
      }
    } catch(e) {
      console.error(e);
      this.displayMessage({ errorMessage: e.message });
    }
  }

  displayMessage(message) {
    this.setState(message);
    setTimeout(() => {
      this.setState({ errorMessage: '', successMessage: '' });
    }, 6000);
  }

  async setCurrentPeriodAndGetNewSales(currentPeriod) {
    await this.setState({ currentPeriod, mySales: undefined });
    await this.getSales();
    this.getTotalViaticos();
  }

  getItemTotal(articulo) {
    const cantidad = _get(articulo, 'cantidad', 0);
    const precio =  _get(articulo, 'precio', 0);
    const descuento = _get(articulo, 'descuento', 0)
    return  ((cantidad * precio) - (descuento));
  }

  updateFromState(newFieldValue) {
    const updatingSaleForm = {
      ...this.state.updatingSaleForm,
      form: {
        ...this.state.updatingSaleForm.form,
        ...newFieldValue
      }
    };
    this.setState({ updatingSaleForm });
  }

  updateUserState(newSaleState) {
    this.setState({
      updatingSaleForm: {
        ...this.state.updatingSaleForm,
        ...newSaleState
      }
    });
  }

  async toggleEditMode(saleIndex) {
      const newSales = this.state.mySales.map((s, i) => ({...s, form: {
        ...s.form,
        isReadMode: !(i === saleIndex)
      }}));
      const soldProduct = this.state.mySales[saleIndex].articulos
        .map(articulo => articulo.articuloId);

      await this.setState({
        mySales: newSales,
        updatingSaleForm: {
          inventario: this.state.inventario,
          availableInventario: this.state.inventario
            .filter(i => i.cantidad)
            .sort(this.sortArticulo)
            .filter(i => !soldProduct.includes(i.articuloId)),
          ...this.state.mySales[saleIndex],
          articulos: this.state.mySales[saleIndex].articulos.map(a => ({
            ...a,
            total: this.getItemTotal(a)
          })),
          form: {
            ...this.state.mySales[saleIndex].form,
            isReadMode: false
          }
        }
      });
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

  async onDeleteSale(e, employeeName, saleId) {
    e.preventDefault();
    if (this.state.isLoadingDelete) {
      return;
    }
    this.setState({ isLoadingDelete: true });
    try {
      const reqDeleted = await Api.deleteReq(Api.VENTAS_URL + `/${employeeName}/${saleId}`);
      if (reqDeleted) {
        const saleIndex = this.state.mySales.findIndex(sale => sale.ventaId === saleId);
        const mySales = [
          ...this.state.mySales.slice(0, saleIndex),
          ...this.state.mySales.slice(saleIndex + 1, this.state.mySales.length),
        ];
        this.setState({ mySales });
        this.displayMessage({ errorMessage: '', successMessage: `Venta con ID:${saleId} Borrada!`, isLoadingDelete: false });
      }
    }catch(e) {
      console.error(e);
      this.displayMessage({ errorMessage: 'Hubo un problema al borrar la venta', isLoadingDelete: false });
    }
  }

  getSalesHeader(sale) {
    return <div className="employee-header-sumary">
      <div className="sale-summary-info between">
        <div className="sumary-el">ID: {sale.ventaId}</div>
        <div className="sumary-el">{sale.form.nombreDoctor}</div>
        {!sale.form.isReadMode && <div className="sumary-el s-w editing">Editando</div>}
        <div className="sumary-el main">{moment(sale.fechaVenta).format('ll')}</div>
      </div>
      <div className="sale-summary-info end">
        <div className="sumary-el">{sale.form.metodoPago}</div>
        <div className="sumary-el money">$ {sale.subTotal} MXN</div>
      </div>
    </div>
  }

  message() {
    return <React.Fragment>
      {
        this.state.errorMessage && <div id="error-message" className="red accent-4 error-msg col s10 message">
         {this.state.errorMessage}
        </div>
      }
      {
        this.state.successMessage && <div id="sucess-message" className="teal accent-4 success-msg col s10 message">
          {this.state.successMessage}
        </div>
      }
    </React.Fragment>
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
        {this.message()}
      </div>
      {
        this.state.mySales ? <div className="row">
          <Collapsible popout>
            {
              !this.state.mySales || !this.state.mySales.length ?
                <h5 className="text-centered"> Sin resultados</h5> :
                this.state.mySales.map((empSale, saleIndex) =>
                  <CollapsibleItem key={empSale.ventaId}
                    header={this.getSalesHeader(empSale)}>
                      {empSale.form.isReadMode ? <SalesForm {...empSale} inventario={this.state.inventario}>
                          <Button onClick={(e) => {e.preventDefault();this.toggleEditMode(saleIndex)}}>Editar</Button>                        
                      </SalesForm> :
                      this.state.inventario && <SalesForm {...this.state.updatingSaleForm}
                        setFormField={(newFieldValue) => this.updateFromState(newFieldValue)}
                        onSubmitForm={(e) => this.onSaleEdit(e, empSale.userName, empSale.ventaId)}
                        updateState={(newState) => this.updateUserState(newState)}>
                          <span className="sale-edit-mode-actions">
                            <Button type="submit" disabled={this.state.ventaLoading}>
                            {!this.state.ventaLoading ?
                              <span>Guardar</span> : <span>Cargando ...</span>}
                            </Button>
                            <a className={`delete ${this.state.isLoadingDelete ? 'disabled' : ''}`}
                              onClick={(e) => this.onDeleteSale(e, empSale.userName, empSale.ventaId)}>
                              <i className="material-icons small">delete_forever</i>
                              { !this.state.isLoadingDelete ? <span>ELIMINAR</span> :
                              <span>ELIMINANDO...</span> }
                            </a>
                          </span>                        
                      </SalesForm>}
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
