import React from 'react';
import * as moment from 'moment';
import {get as _get } from 'lodash';
import { Collapsible, CollapsibleItem, Button, DatePicker } from 'react-materialize';
import { Spinner, SalesForm } from '../core/components';
import { datePickerOptions } from '../core/components/date-picker/date-picker-options';
import { totales } from './totales';
import * as Api from '../core/api';
import './ventas.scss';

export default class Ventas extends React.Component {
  articulo = {
    articuloId: '',
    cantidad: '',
    descuento: '',
    total: 0
  };
  datePickerStartOptions = {};
  datePickerEndOptions = {};
  selectedStartDate = '';
  selectedEndDate = '';
  defaultStartDate = moment('2020-11-29').startOf('day').format('YYYY-MM-DD HH:mm:ss');
  defaultEndDate = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
  hasInvetorio = false;

  constructor() {
    super();
    this.state = {
      totalSales: null,
      stateUsers: null,
      userNames: [],
      fromDate: this.defaultStartDate,
      toDate: this.defaultEndDate,
      showDatePickers: true,
      showResetFilter: false,
      updatingSaleForm: null,
      errorMessage: '',
      successMessage: '',
      isLoadingDelete: false,
      totalViaticos: 0,
      totalEfectivoDisponible: 0
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

  getQueryParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
  }


  async componentDidMount() {
    this.user = JSON.parse(localStorage.getItem('am-user'));
    await this.getPeriod();
    await this.refreshPage();
    document.querySelectorAll('.datepicker-done').forEach((el) => {
      el.addEventListener('click', this.onDoneDate.bind(this), null);
    });
    console.log('state >>> ', this.state);
  }

  componentWillUnmount() {
    document.querySelectorAll('.datepicker-done').forEach((el) => {
      el.removeEventListener('click', this.onDoneDate.bind(this), null);
    });
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

  async refreshPage() {
    await this.setState({totalSales: null,  stateUsers: null});
    await this.getSales();
  }

  async getPeriod() {
    let startOfPeriod;
    try {
      startOfPeriod = await Api.get(`${Api.PERIODS_URL}/latest`);
    }catch(e) {
      console.error('unable to get period >', e);
      startOfPeriod = moment().subtract(14, "days").format('YYYY-MM-DD HH:mm:ss')
    }

    this.defaultStartDate = moment(startOfPeriod).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    await this.resetDatesToDefault();
    await this.setState({
      showDatePickers: true,
    });
  }

  async getSales() {
    try {
      this.selectedUserName = this.getQueryParam('userName');
      const queryDate = `?fromDate=${this.state.fromDate}&toDate=${this.state.toDate}`;
      const sales = await Api.get(`${Api.VENTAS_URL}${queryDate}`);
      let stateUsers = sales || [];
      if (this.selectedUserName) {
        stateUsers = stateUsers.filter(sales => sales.userName === this.selectedUserName);
      }
      stateUsers = stateUsers
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
            fechaVenta: sale.fechaVenta,
            rfc: sale.rfc
          }
        }))
        .reduce((acc, sale) => {
          acc[sale.userName] = {
            sale: _get(acc[sale.userName], 'sale', []).concat(sale),
            subTotal: _get(acc[sale.userName], 'subTotal', 0) + sale.subTotal,
            salesQuantity: _get(acc[sale.userName], 'salesQuantity', 0)+ sale.articulos.length,
            userName: sale.userName
          };
          return acc;
        }, {});
      await this.setState({ totalSales: sales,
        stateUsers: Object.values(stateUsers).sort(this.sortByUserName),
        userNames: Object.keys(stateUsers)
      });
      await this.getTotalViaticos();
    } catch(e) {
      console.error(e);
      this.displayMessage({ errorMessage: e.message });
    }
  }


  async getTotalViaticos() {
    try {
      const queryDate = `?fromDate=${this.state.fromDate}&toDate=${this.state.toDate}`;
      const viaticos = await Api.get(`${Api.VIATICOS_URL}${queryDate}`);
      const totalViaticos = Object.values((this.selectedUserName ? viaticos[this.selectedUserName] : viaticos) || {})
        .reduce((allViaticos, employeeViaticos) =>(
          allViaticos.concat(employeeViaticos)
        ), [])
        .reduce((acc, viatico) => (
          acc + viatico.total
        ), 0);
        const totalEfectivoDisponible = totales.getByMetodos(this.state.totalSales, this.selectedUserName)
          .find(m => m.metodo === 'Efectivo').total - totalViaticos;
      await this.setState({ totalViaticos, totalEfectivoDisponible });
    } catch(e) {
      console.error(e);
      this.displayMessage({ errorMessage: e.message });
    }
  }
  

  async getAllInvetorio() {
    try {
      const inventario = await Api.get(Api.INVENTARIO_URL);
      const invetarioByUser =  this.state.userNames.reduce((acc, userName) => {
        const mappedInvent = inventario.map(invent => ({
          cantidad: invent[userName],
          articulo: invent.articulo,
          articuloId: invent.articuloId,
          precio: invent.precio
        }));
        acc[userName] = {
          inventario: mappedInvent,
          availableInventario: mappedInvent
            .filter(i => i.cantidad)
            .sort(this.sortArticulo)
        }
        return acc;
      }, {});
      const userStateWithInvetory = this.state.stateUsers.map(userState => ({
        ...userState,
        ...invetarioByUser[userState.userName]
      }));
      await this.setState({ stateUsers: userStateWithInvetory });
    } catch(e) {
      this.displayMessage({ errorMessage: e.message});
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
        const newUserState =  this.sliceSale(employeeName, saleId);
        const userIndex = this.state.stateUsers.findIndex(stateUser => stateUser.userName === employeeName)
        await this.setUserState(newUserState, userIndex);
        this.displayMessage({ errorMessage: '', successMessage: 'Venta Borrada', isLoadingDelete: false });
      }
    }catch(e) {
      this.displayMessage({ errorMessage: e.message, isLoadingDelete: false });
    }
  }


  async onSaleEdit(e, userName, ventaId) {
    e.preventDefault();
    const errors = [];
    if (!this.state.updatingSaleForm.articulos.length) {
      errors.push('No hay articulos para vender');
    }
    if (this.state.updatingSaleForm.articulos.some(a => !a.cantidad)) {
      errors.push('hay articulos sin cantidad');
    }
    if (!this.state.updatingSaleForm.form.metodoPago) {
      errors.push('falta agregar el metodo de pago');
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
      IVA: this.state.updatingSaleForm.IVA
    };

    try {
      const response = await Api.post(`${Api.VENTAS_URL}/${userName}/${ventaId}`, toBeSaved);
      if (response && response.ventaId) {
        this.refreshPage();
        this.displayMessage({ successMessage: `la venta con id ${ventaId} de ${userName} ha sido editada`});
      }
    } catch(e) {
      this.displayMessage({ errorMessage: e.message });
    }
  }

  sliceSale(employeeName, saleId) {
    let userState = this.state.stateUsers.find(stateUser => stateUser.userName === employeeName);
    let saleIndex = userState.sale.findIndex(sale => sale.ventaId === saleId);
    userState.sale = [
      ...userState.sale.slice(0, saleIndex),
      ...userState.sale.slice(saleIndex + 1, userState.sale.length),
    ];
    return userState;
  }

  async toggleEditMode(userIndex, saleIndex) {
    if (!this.hasInvetorio) {
      await this.getAllInvetorio();
      this.hasInvetorio = true;
    }
    const newSalesByUser = this.state.stateUsers.map((saleByUser, i) => ({
      ...saleByUser,
      sale: saleByUser.sale.map((sale, j) => ({
        ...sale,
        form: {
          ...sale.form,
          isReadMode: !(i === userIndex && j === saleIndex)
        }
      }))
    }));
    const updatingSaleForm = this.state.stateUsers[userIndex];
    const soldProduct = updatingSaleForm.sale[saleIndex].articulos
      .map(articulo => articulo.articuloId);

    await this.setState({
      stateUsers: [...newSalesByUser],
      updatingSaleForm: {
        inventario: updatingSaleForm.inventario,
        availableInventario: updatingSaleForm.availableInventario
          .filter(i => !soldProduct.includes(i.articuloId)),
        ...updatingSaleForm.sale[saleIndex],
        articulos: updatingSaleForm.sale[saleIndex].articulos.map(a => ({
          ...a,
          total: this.getItemTotal(a)
        })),
        form: {
          ...updatingSaleForm.sale[saleIndex].form,
          isReadMode: false
        }
      }
    });
    console.log('updatingSaleForm > ', this.state.updatingSaleForm);
  }

  getItemTotal(articulo) {
    const cantidad = _get(articulo, 'cantidad', 0);
    const precio =  _get(articulo, 'precio', 0);
    const descuento = _get(articulo, 'descuento', 0)
    return  ((cantidad * precio) - (descuento));
  }

  setUserState(newUserState, userStateIndex) {
    this.setState({
      stateUsers: [
        ...this.state.stateUsers.slice(0, userStateIndex),
        ...this.state.stateUsers.slice(userStateIndex + 1 , this.state.stateUsers.length),
        newUserState
      ].sort(this.sortByUserName)
    });
  }

  updateUserState(newSaleState) {
    this.setState({
      updatingSaleForm: {
        ...this.state.updatingSaleForm,
        ...newSaleState
      }
    });
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

  sortArticulo(a, b) {
    return a.articulo < b.articulo ? -1 : a.articulo === b.articulo ? 0 : 1;
  }

  sortByUserName(a ,b) {
    return a.userName < b.userName ? -1 : a.userName === b.userName ? 0 : 1;
  }

  displayMessage(message) {
    this.setState(message);
    setTimeout(() => {
      this.setState({ errorMessage: '', successMessage: '' });
    }, 6000);
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
    await this.refreshPage();
    await this.setState({
      showDatePickers: true,
    });
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

  getEmployeeHeader(empSales) {
    return <div className="employee-header-sumary">
      <div className="to-left"><b>{empSales.userName}</b></div>
      <div className="to-right">
        <div className="sumary-el s-w">{empSales.salesQuantity} U</div>
        <div className="sumary-el m-w">{empSales.sale.length} Ventas</div>
        <div className="sumary-el l-w"><b>$ {empSales.subTotal.toFixed(2)} MXN</b></div>
      </div>
    </div>;
  }

  getEmployeeSalesHeader(sale) {
    return <div className="employee-header-sumary">
      <div className="to-left">
        <div className="sumary-el s-w">ID: {sale.ventaId}</div>
        <div className="sumary-el ll-w">{moment(sale.fechaVenta).format('ll')} {moment(sale.fechaVenta).format('LT')}</div>
        {!sale.form.isReadMode && <div className="sumary-el s-w editing">Editando</div>}
      </div>
      <div className="to-right">
        <div className="sumary-el s-w">{sale.articulos.length} U</div>
          <div className="sumary-el s-w">IVA: {sale.IVA ? 'SI': 'NO'}</div>
        <div className="sumary-el ll-w">$ {sale.subTotal.toFixed(2)} MXN</div>
      </div>
    </div>
  }

  render() {
    return <div id="ventas">
      <div className="ventas__header">
        <h1>Ventas</h1>
        <div className="filter-headers">
          <h5>Viendo desde </h5>
          {this.state.showDatePickers && <DatePicker options={this.datePickerStartOptions}/>}
          a 
          {this.state.showDatePickers && <DatePicker options={this.datePickerEndOptions}/>}
          {this.state.showResetFilter &&
              <a className="reset-btn" onClick={(e) => this.resetDatesToDefaultAndRefresh(e) }>
                Clear
              </a>
          }
        </div>
      </div>
      <div className="row">
          {this.message()}
          <div className="employees col s12 m10">
            {!this.state.stateUsers ? <Spinner/> : <Collapsible popout accordion={false} className="main-header">
              {this.state.stateUsers.map((empSales, userIndex) => 
                <CollapsibleItem expanded={true}
                  key={empSales.userName + userIndex}
                  header={this.getEmployeeHeader(empSales)}
                  node="div">
                  <Collapsible popout>
                    {empSales.sale.map(((sale, saleIndex) => <CollapsibleItem
                      key={empSales.userName + sale.ventaId + saleIndex}
                      header={this.getEmployeeSalesHeader(sale)}>
                        {
                          (sale.form.isReadMode  ?
                            <SalesForm {...sale}>
                                <Button onClick={(e) => {e.preventDefault();this.toggleEditMode(userIndex, saleIndex)}}>Editar</Button>
                            </SalesForm> :
                            empSales.inventario && <SalesForm {...this.state.updatingSaleForm}
                              setFormField={(newFieldValue) => this.updateFromState(newFieldValue)}
                              onSubmitForm={(e) => this.onSaleEdit(e, sale.userName, sale.ventaId)}
                              updateState={(newState) => this.updateUserState(newState)}>
                                <span className="sale-edit-mode-actions">
                                  <Button type="submit" disabled={this.state.ventaLoading}>
                                  {!this.state.ventaLoading ?
                                    <span>Guardar</span> : <span>Cargando ...</span>}
                                  </Button>
                                  <a className={`delete ${this.state.isLoadingDelete ? 'disabled' : ''}`}
                                    onClick={(e) => this.onDeleteSale(e, sale.userName, sale.ventaId)}>
                                    <i className="material-icons small">delete_forever</i>
                                    { !this.state.isLoadingDelete ? <span>ELIMINAR</span> :
                                    <span>ELIMINANDO...</span> }
                                  </a>
                                </span>                                
                            </SalesForm>)
                        }
                    </CollapsibleItem>))}
                  </Collapsible>
                </CollapsibleItem>
              )}
            </Collapsible>}
          </div>
      </div>
      <h3>Resumen</h3>
      {this.state.totalSales && this.state.totalSales.length ? <div className="totals row">
        <ul className="collection with-header col s11 m3">
          <li className="collection-header bluish"><h5>Total de Ventas</h5></li>
          <li className="collection-item">
            <p><b>Ventas sin IVA:</b> <span>$ {totales.getSinIva(this.state.totalSales, this.selectedUserName).toFixed(2)}</span></p>
          </li>
          <li className="collection-item">
            <p><b>Ventas con IVA: </b> <span>$ {totales.getConIva(this.state.totalSales, this.selectedUserName).toFixed(2)}</span></p>
          </li>
        </ul>
        <ul className="collection with-header col s11 m3">
          <li className="collection-header bluish"><h5>Total por metodo de pago</h5></li>
          {totales.getByMetodos(this.state.totalSales, this.selectedUserName).map((metodoTotal) => (
            <li className="collection-item">
              <p><b>{metodoTotal.metodo}: </b> <span>$ {metodoTotal.total.toFixed(2)}</span></p>
            </li>
          ))}
        </ul>
        {this.state.totalViaticos === undefined ? <Spinner/> :
          <ul className="collection with-header col s11 m3">
            <li className="collection-header bluish"><h5>Total</h5></li>
            <li className="collection-item">
              <p><b>Viaticos usados: </b> <span>$ {this.state.totalViaticos}</span></p>
            </li>
            <li className="collection-item">
              <p><b>Efectivo Disponible: </b> <span>$ {this.state.totalEfectivoDisponible}</span></p>
            </li>
          </ul>}
      </div> : <Spinner/> }
    </div>
  }
}