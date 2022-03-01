import React from 'react';
import * as Api from '../core/api';
import './empleado-invetario.scss';
import { Spinner } from '../core/components';
import { sortInvetario } from '../inventario/sort-invetario.model';
import { get as _get } from 'lodash';

export default class EmpleadoInventario extends React.Component {
  userName = '';

  constructor(props) {
    super(props);
    this.state = {
      inventario: null,
      isLoading: false,
      errorMessage: '',
      search: '',
      invetarioFiltrado: []
    };
  }

  componentDidMount() {
    this.userName = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
    this.getInventario();
  }

  handleSearch(e) {
     const searchedValue = e.target.value;
     let newInvetarioFiltrado = this.state.inventario;
    if (searchedValue) {
      newInvetarioFiltrado = this.state.inventario
        .filter(item =>
          new RegExp(searchedValue.toLowerCase().trim(), 'g').test(item.articulo.toLowerCase().trim()
        ))
        .sort(this.sortArticulo);
    }
    this.setState({ search: searchedValue, invetarioFiltrado: newInvetarioFiltrado });
  }

  async getInventario() {
    this.setState({ inventario: null });
    try {
      const inventario = await Api.get(Api.INVENTARIO_URL + `/${this.userName}`);
      this.setState({
        inventario,
        invetarioFiltrado: sortInvetario(inventario.filter(i => i.cantidad)),
        isLoading: false,
        errorMessage: null
      });
    } catch(e) {
      this.setState({ errorMessage: 'error al obtener el invetario', isLoading: false });
      console.error(e);
    }
  }

  table() {
    if (!this.state.invetarioFiltrado.length) {
      return <h6>No hay inventario</h6>;
    }
    return <table className="row-hover row">
      <thead>
        <tr>
          <th>Artículo</th>
          <th>Precio</th>
          <th>Cantidad</th>
          <th>Categoria</th>
        </tr>
      </thead>
      <tbody>
        {(this.state.invetarioFiltrado).map(item => <tr key={item.articuloId}>
          <td>{item.articulo}</td>
          <td>${item.precio} MXN</td>
          <td className="cantidad">{item.cantidad}</td>
          <td className="cantidad">{item.categoria}</td>
        </tr>)}
      </tbody>
    </table>
  }

  sortArticulo(a, b) {
    return a.articulo < b.articulo ? -1 : a.articulo === b.articulo ? 0 : 1;
  }

  render() {
    return <div id="emplead-inventario">
      <h1>Inventario</h1>
      <div className="row">
        <div className="input-field col s12 m6">
          <i className="material-icons prefix">search</i>
          <input id="buscar-inventorio"
            type="text"
            onChange={(e) => this.handleSearch(e)}
            value={this.state.search}/>
          <label htmlFor="buscar-inventorio">Buscar</label>
        </div>
      </div>
      {this.state.inventario ? this.table() :
        <div className="row spinner"><Spinner/></div>}
    </div>;
  }
}