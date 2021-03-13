import { AlphaDatePicker, AlphaSelect } from '../core/components';
import React from 'react';
import { Select } from 'react-materialize';
import './empleado-ventas.scss';
import * as moment from 'moment';
import { get as _get } from 'lodash';
import * as Api from '../core/api';

export default class EmpleadoVentas extends React.Component {
  userName = 'Ricardo234';
  iva = 1.16;

  articulo = {
    articuloId: '',
    cantidad: '',
    descuento: '',
    total: 0
  };

  constructor(props) {
    super(props);
    this.state = {
      currentDay: moment(),
      inventario: null,
      availableInventario: null,
      form: {
        nombreDoctor: null,
        metodoPago: null,
        facturaEmail: null,
        fechaVenta: '',
        rfc: null,
      },
      errorMessage: '',
      articulos: [{ ...this.articulo }],
      subTotal: 0,
      total: 0,
    };
    this.prevDay = this.prevDay.bind(this);
    this.nextDay = this.nextDay.bind(this);
    this.setNewArticulo = this.setNewArticulo.bind(this);
    this.onDateSelect = this.onDateSelect.bind(this);
  }

  componentDidMount() {
    this.getInvetorio();
  }

  setNewArticulo(articulo, index) {
    let newArticulos;
    let newAvailableInventario = this.state.availableInventario;
    const cantidad = _get(articulo, 'cantidad') || +this.state.articulos[index].cantidad;
    const descuento = _get(articulo, 'descuento') || +this.state.articulos[index].descuento;
    const articuloEnInvetorio = this.state.inventario.find(a => 
      a.articuloId == this.state.articulos[index].articuloId
    );
    const total = (cantidad * _get(articuloEnInvetorio, 'precio', 0)) - descuento;
    
    articulo.total = total;

    if (articulo.articuloId) {
      const artIndex = this.state.availableInventario
      .findIndex((item) => item.articuloId === articulo.articuloId);
      newAvailableInventario = [
        ...this.state.availableInventario.slice(0, artIndex),
        ...this.state.availableInventario.slice(artIndex + 1, this.state.availableInventario.length),
      ];
    }

    if (articulo.cantidad) {
      const id = this.state.articulos[index].articuloId;
      const articuloEnInvetorio = this.state.inventario.find(a => a.articuloId == id);
      articulo.cantidad = articulo.cantidad <= articuloEnInvetorio.cantidad ? articulo.cantidad : articuloEnInvetorio.cantidad;
    }

    const newArt = { ...this.state.articulos[index], ...articulo };
    newArticulos = [
      ...this.state.articulos.slice(0, index),
      newArt,
      ...this.state.articulos.slice(index + 1, this.state.articulos.length),
    ];    

    if (index == this.state.articulos.length -1 && newAvailableInventario.length) {
      newArticulos = [...newArticulos, { ...this.articulo }];
    }
    

    const newSubTotal = newArticulos.reduce((acc, current) => acc + current.total, 0);
    const newTotal = newSubTotal * this.iva;

    this.setState({
      articulos: newArticulos,
      availableInventario: newAvailableInventario,
      subTotal: newSubTotal,
      total: newTotal
    });
  }

  async deleteProducto(index) {
    const producto = this.state.articulos[index];
    const produInventrio = this.state.inventario.find(a => a.articuloId === producto.articuloId);
    let emptyArticulo = [];

    if (!this.state.articulos.some(a => typeof a.articuloId === 'string' && !a.articuloId)) {
      emptyArticulo = [{ ...this.articulo }];
    }
    const newArticulos = [
      ...this.state.articulos.slice(0, index),
      ...this.state.articulos.slice(index + 1, this.state.articulos.length),
    ].concat(emptyArticulo);

    const newAvailableInventario = [
      ...this.state.availableInventario,
      produInventrio
    ].sort(this.sortArticulo);
    
    await this.setState({
      availableInventario: newAvailableInventario,
      articulos: newArticulos
    });
    console.log('state >>', this.state);
  }

  sortArticulo(a, b) {
    return a.articulo < b.articulo ? -1 : a.articulo === b.articulo ? 0 : 1;
  }
  
  async getInvetorio() {
    try {
      const inventario = await Api.get(Api.INVENTARIO_URL + `/${this.userName}`);
      this.setState({
        inventario,
        availableInventario: inventario.sort(this.sortArticulo),
        errorMessage: ''
      });
    } catch(e) {
      this.setState({ errorMessage: e.message });
    }
  }

  prevDay() {
    this.setState({ currentDay: this.state.currentDay.subtract(1, 'day') });
  }

  nextDay() {
    this.setState({ currentDay: this.state.currentDay.add(1, 'day') });
  }

  onDateSelect(date) {
    this.setState({ currentDay: moment(date) });
  }

  getProducto(articulo, i) {
    return <div className="row producto" id={`producto-${articulo.articuloId}`} key={`producto-${i}`}>
      {this.state.articulos[i].articuloId && <div role="button"
          onClick={()=> this.deleteProducto(i)}
          className="producto-delete"
          aria-label="eliminar producto">
        <i title="eliminar producto" className="small material-icons">clear</i>
      </div>}
      <div className="col s11">
        <AlphaSelect
          items={this.state.availableInventario}
          onChange={(item) => this.setNewArticulo({ articuloId: item.articuloId }, i)}
          label={'Producto'}>
        </AlphaSelect>
      </div>
      <div className="input-field col s4">
        <input value={articulo.cantidad}
          id={`cantidad-${i}`}
          disabled={!articulo.articuloId}
          onChange={(e) => this.setNewArticulo({ cantidad: e.target.value ? +e.target.value : ''  }, i)}
          type="number"/>
        <label htmlFor={`cantidad-${i}`}>Cantidad</label>
      </div>
      <div className="input-field col s4">
        <input value={articulo.descuento}
          id={`descuento-${i}`}
          disabled={!articulo.articuloId}
          onChange={(e) => this.setNewArticulo({ descuento: e.target.value ? +e.target.value : '' }, i)}
          type="number"/>
        <label htmlFor={`descuento-${i}`}>Descuento</label>
      </div>
      <div className="input-field col s4">
        <input value={`$ ${articulo.total.toFixed(2)}`} type="text" disabled/>
        <label  className="active">total</label>
      </div>
    </div>
  }

  render() {
    return <div id="empleado-ventas">
      <div className="title">
        <h2>venta</h2>
        <span className="venta-id">ID: 545</span>
      </div>
      {this.state.errorMessage &&
        <div className="red accent-4 error-msg">{this.state.errorMessage}</div>}
      <AlphaDatePicker currentDay={this.state.currentDay}
        prevDay={this.prevDay}
        onDateSelect={this.onDateSelect}
        nextDay={this.nextDay}>
      </AlphaDatePicker>
      <form onSubmit={()=> {} }>

        <div className="row">
          <div className="input-field col s12 m6">
            <input id="doctors-name" type="text"/>
            <label htmlFor="doctors-name">Nombre del Doctor</label>
          </div>
        </div>

        <div className="productos-venta">
          <p>Productos:</p>
          {this.state.articulos.map((articulo, i) => this.getProducto(articulo, i))}
        </div>

        <div className="row venta-footer">
          <div className="selector-search col s6">
            <Select>
              <option disabled value=""> Metodo </option>
              <option value="user">Tarjeta</option>
            </Select>
          </div>
          <div className="totals col s6">
            <div className="input-field col s12">
              <input value={`$ ${this.state.subTotal.toFixed(2)}`} type="text" disabled/>
              <label>sub total</label>
            </div>
            <div className="input-field col s12">
              <input value={`$ ${this.state.total.toFixed(2)}`} type="text" disabled/>
              <label>Total</label>
            </div>
          </div>
        </div>

      </form>
    </div>;
  }
}