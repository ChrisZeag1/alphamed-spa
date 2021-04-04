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
      toDate: moment().add(1, 'day').format('YYYY-MM-DD')
    }
  }

  componentDidMount() {
    this.getSales();
  }

  async getSales() {
    const queryDate = `?fromDate=${this.state.fromDate}=&toDate=${this.state.toDate}`;
    const totalSales = await Api.get(`${Api.VENTAS_URL}${queryDate}`);
    const stateUsers = (totalSales || [])
      .map(sales => ({
        ...sales,
        form: {
          isReadMode: true,
          nombreDoctor: sales.nombreDoctor,
          metodoPago: sales.metodoPago,
          facturaEmail: sales.facturaEmail,
          nota: sales.nota,
          metodosPago: sales.metodosPago,
          fechaVenta: sales.fechaVenta,
          rfc: sales.rfc,
        },
        articulos: [...sales.articulos]
      }))
      .reduce((acc, sale) => {
        acc[sale.userName] = {
          sale: _get(acc[sale.userName], 'sale', []).concat(sale),
          subTotal: _get(acc[sale.userName], 'subTotal', 0) + sale.subTotal,
          itemQuantity: _get(acc[sale.userName], 'itemQuantity', 0)+ sale.articulos.length,
          userName: sale.userName
        };
        return acc;
      }, {});
      this.setState({ totalSales , stateUsers: Object.values(stateUsers).sort(this.sortByUserName) });
      
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
    this.setState({
      stateUsers: [...newSalesByUser]
    });
  }

  setUserState(newUserState, userStateIndex) { 
    this.setState({
      stateUsers: [
        ...this.state.stateUsers.slice(0, userStateIndex),
        ...this.state.stateUsers.slice(userStateIndex + 1 , this.state.stateUsers.length),
        newUserState
      ].sort(this.sortByUserName)
    })
  }

  updateUserState(userName, saleIndex, newSaleState) {
    const { availableInventario } = newSaleState;
    delete newSaleState.availableInventario;
    const oldUserStateIndex = this.state.stateUsers.findIndex(stateUser => stateUser.userName === userName);
    const oldUserState = this.state.stateUsers[oldUserStateIndex];
    oldUserState.sale[saleIndex] = {
      ...oldUserState.sale[saleIndex],
      ...newSaleState
      
    };
    const userSales = {
      ...oldUserState,
      availableInventario: availableInventario && availableInventario.length ?
        availableInventario : oldUserState.availableInventario
    };
    console.log('update user state >', userSales);
    this.setUserState(userSales, oldUserStateIndex);
  }

  
  updateFromState(userName, saleIndex, newFieldValue) {
    const userSalesIndex = this.state.stateUsers.findIndex(sales => sales.userName === userName);
    const userSales = this.state.stateUsers[userSalesIndex];
    userSales.sale[saleIndex] = {
      ...userSales.sale[saleIndex],
      form: {
        ...userSales.sale[saleIndex].form,
        ...newFieldValue
      }
    }
    this.setUserState(userSales, userSalesIndex);
  }

  async onSubmitForm(userName, saleIndex, e) {
    const userSales = this.state.stateUsers.find(sales => sales.userName === userName);
    const userState = userSales.sale[saleIndex];
    e.preventDefault();
    const articulos = userState.articulos.filter(a => a.articuloId);
    const errors = [];
    if (!articulos.length) {
      errors.push('No hay articulos para vender');
    }
    if(!userState.form.metodoPago) {
      errors.push('falta agregar el metodo de pago');
    }
    if(errors.length) {
      this.setState({ errorMessage: errors.join(',  ')});
      window.scroll({ top: 0,  behavior: 'smooth' });
      return;
    }

    const toBeSaved = {
      ...userState.form,
      articulos: userState.articulos.filter(a => a.articuloId),
      subTotal: +(userState.subTotal.toFixed(2)),
      total: +(userState.total.toFixed(2)),
      IVA: userState.IVA
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
        <div className="sumary-el s-w">{empSales.itemQuantity} U</div>
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
                        <SalesForm {...sale} 
                          availableInventario={empSales.availableInventario}
                          inventario={empSales.inventario}
                          setFormField={(newFieldValue) => this.updateFromState(empSales.userName, saleIndex, newFieldValue)}
                          onSubmitForm={(e) => this.onSubmitForm(empSales.userName, saleIndex, e)}
                          updateState={(newState) =>  this.updateUserState(empSales.userName, saleIndex, newState)}>
                          {
                            sale.form.isReadMode ? <Button onClick={(e) => {e.preventDefault();this.toggleEditMode(userIndex, saleIndex)}}>Editar</Button> :
                            <span className="sale-edit-mode-actions">
                              <Button type="submit" disabled={this.state.ventaLoading}>
                              {!this.state.ventaLoading ?
                                <span>Guardar</span> : <span>Cargando ...</span>}
                              </Button>
                              <a>ELIMINAR</a>
                            </span>
                          }
                        </SalesForm>}
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