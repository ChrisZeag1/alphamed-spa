import React from 'react';
import { SalesForm } from '../core/components';
import { Button } from 'react-materialize';
import './empleado-ventas.scss';
import * as moment from 'moment';
import { get as _get } from 'lodash';
import * as Api from '../core/api';

export default class EmpleadoVentas extends React.Component {
  form = {
    isReadMode: false,
    nombreDoctor: '',
    metodoPago: '',
    facturaEmail: '',
    nota: '',
    metodoPago: '',
    rfc: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      inventario: null,
      fechaVenta: moment(),
      availableInventario: null,
      ventaLoading: false,
      form: {
        ...this.form
      },
      errorMessage: '',
      successMessage: '',
      articulos: [],
      subTotal: 0,
      total: 0,
      IVA: false
    };

    this.updateState = this.updateState.bind(this);
    this.setFormField = this.setFormField.bind(this);
    this.onSubmitForm = this.onSubmitForm.bind(this);
  }

  async componentDidMount() {
    // TODO: remove timeout, issue hapening after login only;
    setTimeout(async() => {
      this.userName = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
      await this.getInvetorio();
    }, 1000);
  }

  updateState(newStates) {
    this.setState(newStates);
  }

  setFormField(newFieldValue) {
    this.setState({ form: { ...this.state.form, ...newFieldValue } } );
  }

  clearForm() {
    this.setState({
      form: {
        ...this.form
      },
      articulos: [],
      subTotal: 0,
      total: 0,
      IVA: false
    });

  }

  sortArticulo(a, b) {
    return a.articulo < b.articulo ? -1 : a.articulo === b.articulo ? 0 : 1;
  }

  

  async onSubmitForm(e) {
    e.preventDefault();
    const articulos = this.state.articulos.filter(a => a.articuloId);
    const errors = [];
    if (!articulos.length) {
      errors.push('No hay artículos para vender');
    }
    if(!this.state.form.metodoPago) {
      errors.push('Falta agregar el método de pago');
    }
    if(errors.length) {
      this.setState({ errorMessage: errors.join(',  ')});
      window.scroll({ top: 0,  behavior: 'smooth' });
      return;
    }

    const toBeSaved = {
      ...this.state.form,
      articulos: this.state.articulos.filter(a => a.articuloId),
      fechaVenta: this.state.fechaVenta.format('YYYY-MM-DD HH:mm:ss:SS'),
      subTotal: +(this.state.subTotal.toFixed(2)),
      total: +(this.state.total.toFixed(2)),
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
        }, 4000);
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
        availableInventario: inventario.filter(i => i.cantidad).sort(this.sortArticulo),
        errorMessage: ''
      });
    } catch(e) {
      this.setState({ errorMessage: e.message });
    }
  }

  render() {
    return <div id="empleado-ventas">
      <div className="title">
        <h2>Venta</h2>
        <h5 className="fecha-venta">{this.state.fechaVenta.format('DD/MM/YYYY')}</h5>
      </div>
      {this.state.errorMessage &&
        <div  id="error-message" className="red accent-4 error-msg">{this.state.errorMessage}
        </div>}
      {this.state.successMessage &&
      <div  id="success-message" className="teal accent-4 success-msg">{this.state.successMessage}
      </div>}
        <SalesForm {...this.state}
          setFormField={this.setFormField}
          onSubmitForm={this.onSubmitForm}
          updateState={this.updateState}>
          <Button type="submit" disabled={this.state.ventaLoading}>
            {!this.state.ventaLoading ?
              <span>Vender</span> : <span>Cargando ...</span>}
          </Button>
        </SalesForm>
    </div>;
  }
}