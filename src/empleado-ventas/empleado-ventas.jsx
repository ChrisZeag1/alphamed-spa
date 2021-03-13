import { AlphaSelect } from '../core/components';
import React from 'react';
import { Select, Button, Checkbox, Collapsible, CollapsibleItem, Icon, Textarea } from 'react-materialize';
import './empleado-ventas.scss';
import * as moment from 'moment';
import { get as _get } from 'lodash';
import { METODOS_PAGO } from './metodo-pagos';
import * as Api from '../core/api';

export default class EmpleadoVentas extends React.Component {
  userName = 'Ricardo234';
  ivaValue = 1.16;
  metodosPago = [
    METODOS_PAGO.TPV,
    METODOS_PAGO.EFECTIVO,
    METODOS_PAGO.TRANSFERENCIA,
    METODOS_PAGO.CHEQUES
  ];
  articulo = {
    articuloId: '',
    cantidad: '',
    descuento: '',
    total: 0
  };
  form = {
    nombreDoctor: '',
    metodoPago: '',
    facturaEmail: '',
    nota: '',
    metodosPago: '',
    fechaVenta: moment(),
    rfc: ''
  }

  constructor(props) {
    super(props);
    this.state = {
      inventario: null,
      availableInventario: null,
      ventaLoading: false,
      form: {
        ...this.form
      },
      errorMessage: '',
      successMessage: '',
      articulos: [{ ...this.articulo }],
      subTotal: 0,
      total: 0,
      IVA: false
    };
    this.setNewArticulo = this.setNewArticulo.bind(this);
  }

  componentDidMount() {
    this.getInvetorio();
  }

  clearForm() {
    this.setState({
      form: {
        ...this.form
      },
      articulos: [{ ...this.articulo }],
      subTotal: 0,
      total: 0,
      IVA: false
    })

  }

  setNewArticulo(articulo, index) {
    let newArticulos;
    let newAvailableInventario = this.state.availableInventario;
    if (articulo.cantidad) {
      const id = this.state.articulos[index].articuloId;
      const articuloEnInvetorio = this.state.inventario.find(a =>
        a.articuloId === id
      );
      articulo.cantidad = articulo.cantidad <= articuloEnInvetorio.cantidad ? articulo.cantidad : articuloEnInvetorio.cantidad;
    }

    const cantidad = _get(articulo, 'cantidad') || +this.state.articulos[index].cantidad;
    const descuento = _get(articulo, 'descuento') || +this.state.articulos[index].descuento;
    const articuloEnInvetorio = this.state.inventario.find(a => 
      a.articuloId === this.state.articulos[index].articuloId
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

    const newArt = { ...this.state.articulos[index], ...articulo };
    newArticulos = [
      ...this.state.articulos.slice(0, index),
      newArt,
      ...this.state.articulos.slice(index + 1, this.state.articulos.length),
    ];    

    if (index === this.state.articulos.length -1 && newAvailableInventario.length) {
      newArticulos = [...newArticulos, { ...this.articulo }];
    }
    

    const newSubTotal = newArticulos.reduce((acc, current) => acc + current.total, 0);
    let newTotal = newSubTotal;

    if (this.state.IVA) {
      newTotal = newSubTotal * this.ivaValue;
    }

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

  toogleIva() {
    const hasIVA = !this.state.IVA;
    let total = this.state.subTotal;
    if (hasIVA) {
      total = this.state.subTotal * this.ivaValue;
    }
    this.setState({ IVA: hasIVA,  total });
  }

  setFacturaEmail(email) {
    this.setState({ form: { ...this.state.form,  facturaEmail: email } });
  }

  setRfc(rfc) {
    this.setState({ form: { ...this.state.form,  rfc } });
  }

  setNombreDoctor(nombreDoctor) {
    this.setState({ form: { ...this.state.form,  nombreDoctor } });
  }
  setNota(nota) {
    this.setState({ form: { ...this.state.form,  nota } });
  }

  setMetodoPago(metodoPago) {
    const hasIva = metodoPago === METODOS_PAGO.TPV;
    if(hasIva && !this.state.IVA) {
      this.toogleIva();
    }
    this.setState({ form: { ...this.state.form,  metodoPago }});
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
      total: this.state.total,
      IVA: this.state.IVA
    };
    this.setState({ ventaLoading: true });

    try {
      const res = await Api.post(`${Api.VENTAS_URL}/${this.userName}`, toBeSaved);
      if (!res) {
        this.setState({
          errorMessage: 'Hubo un error, vuelve a intentar',
          successMessage: '',
          ventaLoading: false
        });
        window.scroll({ top: 0,  behavior: 'smooth' });
      } else {
        this.setState({
          errorMessage: '',
          successMessage: 'Venta realizada! 🎉',
          ventaLoading: false
        });
        window.scroll({ top: 0,  behavior: 'smooth' });
        this.getInvetorio();
        this.clearForm();
        setTimeout(() => {
          this.setState({ successMessage: '' });
        }, 7000);
      }
    } catch(e) {
      this.setState({ errorMessage: e.message, ventaLoading: false });
      window.scroll({ top: 0,  behavior: 'smooth' });
    }
  }

  async getInvetorio() {
    this.setState({ inventario: null, availableInventario: null });
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
        <h5 className="fecha-venta">{this.state.form.fechaVenta.format('DD/MM/YYYY')}</h5>
      </div>
      {this.state.errorMessage &&
        <div  id="error-message" className="red accent-4 error-msg">{this.state.errorMessage}
        </div>}
      {this.state.successMessage &&
      <div  id="success-message" className="teal accent-4 success-msg">{this.state.successMessage}
      </div>}
      <form onSubmit={(e) => this.onSubmitForm(e) }>

        <div className="row">
          <div className="input-field col s12 m6">
            <input id="doctors-name"
              value={this.state.form.nombreDoctor}
              onChange={(e) => this.setNombreDoctor(e.target.value)}
              type="text"/>
            <label htmlFor="doctors-name">Nombre del Doctor</label>
          </div>
        </div>

        <div className="productos-venta">
          <p>Productos:</p>
          {this.state.articulos.map((articulo, i) => this.getProducto(articulo, i))}
        </div>

        <div className="row venta-factura">
          <Collapsible popout accordion>
            <CollapsibleItem expanded={false}
              icon={<Icon>local_offer</Icon>}
              header="Datos Factura"
              node="div">
              <div className="input-field">
                <input value={this.state.form.facturaEmail}
                  id="factura-email"
                  onChange={(e) => this.setFacturaEmail(e.target.value)}
                  type="email"/>
                <label htmlFor="factura-email">Correo Electrónico</label>
              </div>
              <div className="input-field">
                <input value={this.state.form.rfc}
                  id="factura-rfc"
                  onChange={(e) => this.setRfc(e.target.value)}
                  type="text"/>
                <label htmlFor="factura-rfc">RFC</label>
              </div>
            </CollapsibleItem>
            <CollapsibleItem expanded={false}
              icon={<Icon>note_add</Icon>}
              header="Nota"
              node="div">
              <div className="text-area">
                <Textarea value={this.state.form.nota}
                  id="venta-nota"
                  onChange={(e) => this.setNota(e.target.value)}/>
              </div>
            </CollapsibleItem>            
          </Collapsible>
        </div>

        <div className="row venta-footer">
          <div className="selector-search col s6">
            <Select value={this.state.form.metodosPago} onChange={(e) => this.setMetodoPago(e.target.value) }>
              <option disabled defaultValue selected value=""> Metodo </option>
              {this.metodosPago.map(metodo => (<option key={metodo} value={metodo}>{metodo}</option>))}
            </Select>
          </div>
          <div className="totals col s6">
            <div className="col s12 venta-iva">
            <Checkbox label="Iva" value={this.state.IVA + ''} checked={this.state.IVA} onChange={() => this.toogleIva()}/>
            </div>
            <div className="input-field col s12">
              <input value={`$ ${this.state.subTotal.toFixed(2)}`} type="text" disabled/>
              <label className="active">sub total</label>
            </div>
            <div className="input-field col s12">
              <input value={`$ ${this.state.total.toFixed(2)}`} type="text" disabled/>
              <label className="active">Total</label>
            </div>
          </div>
        </div>
        <div className="row text-centered">
          <Button type="submit" disabled={this.state.ventaLoading}>
            {!this.state.ventaLoading ?
              <span>Vender</span> : <span>Cargando ...</span>}
          </Button>
        </div>
      </form>
    </div>;
  }
}