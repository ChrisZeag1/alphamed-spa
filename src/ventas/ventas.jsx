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
      salesByUserName: null,
      fromDate: '2020-11-29',
      toDate: moment().add(1, 'day').format('YYYY-MM-DD'),
      inventariosPerEmployee: {
        [undefined]: {
          inventario: null,
          availableInventario: null,
        }
      }
    }
  }

  componentDidMount() {
    this.getSales();
  }

  async getSales() {
    const queryDate = `?fromDate=${this.state.fromDate}=&toDate=${this.state.toDate}`;
    const totalSales = await Api.get(`${Api.VENTAS_URL}${queryDate}`);
    const salesByUserName = (totalSales || [])
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
      this.setState({ totalSales , salesByUserName: Object.values(salesByUserName).sort(this.sortByUserName) });
      
      const employeeNames = Object.keys(salesByUserName);
      console.log('employeeNames >>', employeeNames);
      const inventoryPerEmployeePromise = employeeNames.map(employeeName => this.getInvetorio(employeeName));
      Promise.all(inventoryPerEmployeePromise).then((inventarios) => {
        const perEmployee = inventarios.reduce((current, invent, i) => {
          current[employeeNames[i]] = {
            inventario: invent,
            availableInventario: invent.filter(i => i.cantidad).sort(this.sortArticulo)
          };
          return current;
        }, {})

        this.setState({ inventariosPerEmployee: perEmployee });
        console.log('per employee >>', perEmployee);
      }).catch((e) => {
        this.setState({ errorMessage: e.message });
      })
  }

  async getInvetorio(employeeName) {
    this.setState({ inventariosPerEmployee: { ...this.state.inventariosPerEmployee, inventario: null, availableInventario: null } } );
    return Api.get(Api.INVENTARIO_URL + `/${employeeName}`);
  }

  toggleEditMode(userIndex, saleIndex) {
    const newSalesByUser = this.state.salesByUserName.map((saleByUser, i) => ({
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
      salesByUserName: [...newSalesByUser]
    });
  }
  

  updateFromState(userName, saleIndex, newFieldValue) {
    const userSales = this.state.salesByUserName.find(sales => sales.userName === userName);
    userSales.sale[saleIndex] = {
      ...userSales.sale[saleIndex],
      form: {
        ...userSales.sale[saleIndex].form,
        ...newFieldValue
      }
    }
    this.setState({
      salesByUserName: [...this.state.salesByUserName, userSales].sort(this.sortByUserName)
    });
  }

  async onSubmitForm(e) {
    e.preventDefault();
    const articulos = this.state.articulos.filter(a => a.articuloId);
    const errors = [];
    if (!articulos.length) {
      errors.push('No hay articulos para vender');
    }
    if(!this.state.form.metodoPago) {
      errors.push('falta agregar el metodo de pago');
    }
    if(errors.length) {
      this.setState({ errorMessage: errors.join(',  ')});
      window.scroll({ top: 0,  behavior: 'smooth' });
      return;
    }

    const toBeSaved = {
      ...this.state.form,
      articulos: this.state.articulos.filter(a => a.articuloId),
      subTotal: +(this.state.subTotal.toFixed(2)),
      total: +(this.state.total.toFixed(2)),
      IVA: this.state.IVA
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
            {!this.state.salesByUserName ? <Spinner/> : <Collapsible popout accordion={false}>
              {this.state.salesByUserName.map((empSales, userIndex) => 
                <CollapsibleItem expanded={true}
                  key={empSales.userName}
                  header={this.getEmployeeHeader(empSales)}
                  node="div">
                  <Collapsible popout>
                    {empSales.sale.map(((sale, saleIndex) => <CollapsibleItem
                      key={empSales.userName + sale.ventaId}
                      header={this.getEmployeeSalesHeader(sale)}>
                        { this.state.inventariosPerEmployee[empSales.userName] &&
                        <SalesForm {...sale}
                          {...this.state.inventariosPerEmployee[empSales.userName]}
                          setFormField={(newFieldValue) => this.updateFromState(empSales.userName, saleIndex, newFieldValue)}
                          onSubmitForm={this.onSubmitForm}
                          updateState={this.updateState}>
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