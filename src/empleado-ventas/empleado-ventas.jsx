import React from 'react';
import { jsPDF } from 'jspdf';
import { SalesForm } from '../core/components';
import { Button } from 'react-materialize';
import './empleado-ventas.scss';
import * as moment from 'moment';
import { get as _get } from 'lodash';
import { sortInvetario } from '../inventario/sort-invetario.model';
import { NotaVenta } from './nota-venta';
import * as Api from '../core/api';

const docPDF = new jsPDF();

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
      IVA: false,
      saved: null
    };

    this.updateState = this.updateState.bind(this);
    this.setFormField = this.setFormField.bind(this);
    this.onSubmitForm = this.onSubmitForm.bind(this);
  }

  async componentDidMount() {
    // TODO: remove timeout, issue hapening after login only;
    setTimeout(async() => {
      this.userName = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
      this.nombreUsuario = _get(JSON.parse(localStorage.getItem('am-user')), 'nombre');
      await this.getInvetorio();
    }, 1000);
  }

  print() {
    const printNode = document.getElementById('nota-venta-print');
    printNode.style.display = 'block';
    const fileName = moment(this.state.saved.fechaVenta).format('YYYY.MM.DD') + '-ID:' + this.state.saved.ventaId;
    docPDF.html(printNode, {
      callback: function(docPDF) {
          docPDF.save(fileName + '.pdf');
          printNode.style.display = 'none';
      },
      width: 200,
      windowWidth: 1000
    });
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
        await this.setState({ saved: {
          ...toBeSaved,
          ventaId: res.ventaId,
          fechaVenta: toBeSaved.fechaVenta.split(' ')[0],
          nombreUsuario: this.nombreUsuario
        } });
        this.print();
        window.scroll({ top: 0,  behavior: 'smooth' });
        this.getInvetorio();
        this.clearForm();
        setTimeout(() => {
          this.setState({ successMessage: '' });
          this.setState({ saved: null });
        }, 4000);
      }
    } catch(e) {
      console.error(e);
      this.setState({ errorMessage: 'Hubo un problema al guardar la venta. Intenta de nuevo.', ventaLoading: false });
      window.scroll({ top: 0,  behavior: 'smooth' });
    }
  }

  async getInvetorio() {
    this.setState({ inventario: null, availableInventario: null });
    try {
      const inventario = await Api.get(Api.INVENTARIO_URL + `/${this.userName}`);
      this.setState({
        inventario,
        availableInventario: sortInvetario(inventario.filter(i => i.cantidad)),
        errorMessage: ''
      });
    } catch(e) {
      this.setState({ errorMessage: 'Hubo un problema al obtener el invetario. Itenta de nuevo.' });
    }
  }

  render() {
    return <React.Fragment>
      <div id="empleado-ventas">
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
      </div>
      {this.state.saved && <NotaVenta venta={this.state.saved}></NotaVenta>}
    </React.Fragment>;
  }
}