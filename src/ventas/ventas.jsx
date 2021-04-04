import React from 'react';
import * as moment from 'moment';
import {get as _get } from 'lodash';
import { Collapsible, CollapsibleItem, Button } from 'react-materialize';
import { Spinner, SalesForm } from '../core/components';
import * as Api from '../core/api';
import './ventas.scss';

export default class Ventas extends React.Component {
  user = JSON.parse(localStorage.getItem('am-user'));
  articulo = {
    articuloId: '',
    cantidad: '',
    descuento: '',
    total: 0
  };

  constructor() {
    super();
    this.state = {
      totalSales: null,
      stateUsers: null,
      fromDate: '2020-11-29',
      toDate: moment().add(1, 'day').format('YYYY-MM-DD'),
      updatingSaleForm: null,
      errorMessage: '',
      successMessage: '',
      isLoadingDelete: false,
    };
  }

  componentDidMount() {
    this.getSales();
  }

  async getSales() {
    const queryDate = `?fromDate=${this.state.fromDate}=&toDate=${this.state.toDate}`;
    const sales = await Api.get(`${Api.VENTAS_URL}${queryDate}`);
    const stateUsers = (sales || [])
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
      this.setState({ totalSales: sales , stateUsers: Object.values(stateUsers).sort(this.sortByUserName) });
      
      const employeeNames = Object.keys(stateUsers);
      const inventoryPerEmployeePromise = employeeNames.map(employeeName => this.getInvetorio(employeeName));
      Promise.all(inventoryPerEmployeePromise).then((inventarios) => {
        const perEmployee = inventarios.reduce((current, invent, i) => {
          current[employeeNames[i]] = {
            inventario: invent,
            availableInventario: invent.filter(i => i.cantidad).sort(this.sortArticulo)
          };
          return current;
        }, {});

        const userStateWithInvetory = this.state.stateUsers.map(userState => ({
          ...userState,
          ...perEmployee[userState.userName]
        }));
        this.setState({ stateUsers: userStateWithInvetory });
        console.log('per employee >>', userStateWithInvetory);
      }).catch((e) => {
        this.setState({ errorMessage: e.message });
      })
  }

  async getInvetorio(employeeName) {
    return Api.get(Api.INVENTARIO_URL + `/${employeeName}`);
  }

  async deleteSale(e, employeeName, saleId) {
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
        this.setState({ errorMessage: '', successMessage: 'Venta Borrada', isLoadingDelete: false });
      }
    }catch(e) {
      this.setState({ errorMessage: e.message, isLoadingDelete: false });
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


  toggleEditMode(userIndex, saleIndex) {
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
    this.setState({
      stateUsers: [...newSalesByUser],
      updatingSaleForm: {
        inventario: updatingSaleForm.inventario,
        availableInventario: updatingSaleForm.availableInventario,
        ...updatingSaleForm.sale[saleIndex],
        form: {
          ...updatingSaleForm.sale[saleIndex].form,
          isReadMode: false
        }
      }
    });
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

  async onSubmitForm(e) {
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
      this.setState({ errorMessage: errors.join(',  ')});
      window.scroll({ top: 0,  behavior: 'smooth' });
      console.log('sale >>', this.state.updatingSaleForm);
      return;
    }

    const toBeSaved = {
      ...this.state.updatingSaleForm.form,
      articulos: this.state.updatingSaleForm.articulos.filter(a => a.articuloId),
      subTotal: +(this.state.updatingSaleForm.subTotal.toFixed(2)),
      total: +(this.state.updatingSaleForm.total.toFixed(2)),
      IVA: this.state.updatingSaleForm.IVA
    };
    console.log('to  be saved >>>>>', toBeSaved);
    
  }

  sortArticulo(a, b) {
    return a.articulo < b.articulo ? -1 : a.articulo === b.articulo ? 0 : 1;
  }

  sortByUserName(a ,b) {
    return a.userName < b.userName ? -1 : a.userName === b.userName ? 0 : 1;
  }

  getEmployeeHeader(empSales) {
    return <div className="employee-header-sumary">
      <div className="to-left">{empSales.userName}</div>
      <div className="to-right">
        <div className="sumary-el s-w">{empSales.salesQuantity} U</div>
        <div className="sumary-el m-w">{empSales.sale.length} Ventas</div>
        <div className="sumary-el l-w">$ {empSales.subTotal} MXN</div>
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
        <div className="sumary-el ll-w">$ {sale.subTotal} MXN</div>
      </div>
    </div>
  }

  render() {
    return <div id="ventas">
      <div className="ventas__header">
        <h1>Ventas</h1>
        <h5>Viendo desde <i>{this.state.fromDate}</i> a <i>{this.state.toDate}</i></h5>
      </div>
      <div className="row">
          <div className="employees col s12 m10">
            {!this.state.stateUsers ? <Spinner/> : <Collapsible popout accordion={false}>
              {this.state.stateUsers.map((empSales, userIndex) => 
                <CollapsibleItem expanded={true}
                  key={empSales.userName + userIndex}
                  header={this.getEmployeeHeader(empSales)}
                  node="div">
                  <Collapsible popout>
                    {empSales.sale.map(((sale, saleIndex) => <CollapsibleItem
                      key={empSales.userName + sale.ventaId + saleIndex}
                      header={this.getEmployeeSalesHeader(sale)}>
                        { empSales.inventario &&
                          (sale.form.isReadMode  ?
                            <SalesForm {...sale}
                              availableInventario={empSales.availableInventario}
                              inventario={empSales.inventario}>
                                <Button onClick={(e) => {e.preventDefault();this.toggleEditMode(userIndex, saleIndex)}}>Editar</Button>
                            </SalesForm> :
                            <SalesForm {...this.state.updatingSaleForm}
                              setFormField={(newFieldValue) => this.updateFromState(newFieldValue)}
                              onSubmitForm={(e) => this.onSubmitForm(e)}
                              updateState={(newState) => this.updateUserState(newState)}>
                                <span className="sale-edit-mode-actions">
                                  <Button type="submit" disabled={this.state.ventaLoading}>
                                  {!this.state.ventaLoading ?
                                    <span>Guardar</span> : <span>Cargando ...</span>}
                                  </Button>
                                  <a className={`delete ${this.state.isLoadingDelete ? 'disabled' : ''}`}
                                    onClick={(e) => this.deleteSale(e, sale.userName, sale.ventaId)}>
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
      <div>
      </div>
    </div>
  }
}