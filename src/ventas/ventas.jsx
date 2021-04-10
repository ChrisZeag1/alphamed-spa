import React from 'react';
import * as moment from 'moment';
import {get as _get } from 'lodash';
import { Collapsible, CollapsibleItem, Button } from 'react-materialize';
import { Spinner, SalesForm } from '../core/components';
import * as Api from '../core/api';
import './ventas.scss';

export default class Ventas extends React.Component {
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
      userNames: [],
      toDate: moment().add(5, 'day').format('YYYY-MM-DD'),
      updatingSaleForm: null,
      errorMessage: '',
      successMessage: '',
      isLoadingDelete: false,
    };
  }

  componentDidMount() {
    this.user = JSON.parse(localStorage.getItem('am-user'));
    this.refreshPage();
  }

  async refreshPage() {
    await this.getSales();
    this.getAllInvetorio();
  }

  async getSales() {
    try {
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
      await this.setState({ totalSales: sales,
        stateUsers: Object.values(stateUsers).sort(this.sortByUserName),
        userNames: Object.keys(stateUsers)
      });
    } catch(e) {
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
        this.displayMessage({ errorMessage: '', successMessage: 'Venta Borrada', isLoadingDelete: false });
      }
    }catch(e) {
      this.displayMessage({ errorMessage: e.message, isLoadingDelete: false });
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
    const soldProduct = updatingSaleForm.sale[saleIndex].articulos
      .map(articulo => articulo.articuloId);

    this.setState({
      stateUsers: [...newSalesByUser],
      updatingSaleForm: {
        inventario: updatingSaleForm.inventario,
        availableInventario: updatingSaleForm.availableInventario
          .filter(i => !soldProduct.includes(i.articuloId)),
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

  async onSubmitForm(e, userName, ventaId) {
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
          {this.message()}
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
                              onSubmitForm={(e) => this.onSubmitForm(e, sale.userName, sale.ventaId)}
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