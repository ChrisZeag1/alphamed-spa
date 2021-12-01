import React from 'react';
import * as Api from '../core/api';
import './empleados.scss';
import { Spinner } from '../core/components';
import { Link } from 'react-router-dom';
import { get as _get } from 'lodash';
import { Modal, Select, Button } from 'react-materialize';

export const Actions = (props) => (
  <ul className="collection z-depth-4">
    <li className="collection-item"  key="invetario">
      <Link to={`/invetario?userName=${props.user.userName}&name=${props.user.nombre}`}>
        <i className="small material-icons">library_books</i>
        <span>Inventario</span>
      </Link>
    </li>
    <li className="collection-item" key="ventas">
      <Link to={`/ventas?userName=${props.user.userName}&name=${props.user.nombre}`}>
        <i className="small material-icons">attach_money</i>
        <span>Ventas</span>
      </Link>
    </li>
    <li className="collection-item" key="delete">
      <Button className="waves-effect waves-teal btn-flat"
              disabled={props.isLoading}
              flat={true}
              onClick={() => props.delUpdate(props.user.userName)}>
        {!props.isLoading ? <span>
          <i className="small material-icons">delete</i>
            Eliminar
        </span> :
        <span>
          Cargando...
        </span>}
      </Button>
    </li>
  </ul>
);

export default class Empleados extends React.Component {
  modalOptions;
  emptyFrom =  {
    nombre: '',
    userName: '',
    email: '',
    rol: '',
    password: ''
  };

  constructor(props) {
    super(props)
    this.state = {
      usuarios: undefined,
      toogleAction: {},
      modal: false,
      isLoading: false,
      form: { ...this.emptyFrom },
      errorMessage: '',
    }
    this.modalOptions = {
      onCloseStart: () => this.setState({ modal: false, form: { ...this.emptyFrom }, errorMessage: '' })
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.delUpdate = this.delUpdate.bind(this);
  }

  componentDidMount() {
    this.getUsers();
  }

  toggleActionChange(index) {
    const newState = { [index]: !this.state.toogleAction[index]  };
    this.setState({ toogleAction: newState });
  }

  handleChange(e, value) {
    this.setState({ form: { ...this.state.form, [value]: e.target.value } });
  }

  handleSubmit(e) {
    e.preventDefault();
    const hasAllValues = Object.values(this.state.form).every(Boolean);
    if(!hasAllValues) {
      this.setState({ errorMessage: 'Todos los campos son requeridos' })
      return;
    }
    this.saveUserAndUpdate();
  }
  
  async getUsers() {
    const users = await Api.get(Api.USERS_URL);
    const currentUser = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
    this.setState({
      usuarios: users.filter(u => u.userName !== currentUser),
      isLoading: false,
      errorMessage: null
    });
  }

  async saveUserAndUpdate() {
    try {
      this.setState({ isLoading: true });
      const postUser= await Api.post(Api.USERS_URL, { ...this.state.form} );
      if (postUser && postUser.userName) {
        this.setState({ usuarios: undefined });
        this.getUsers();
        this.setState({ modal: false, form: this.emptyFrom });
      }
    } catch(e) {
      console.error(e);
      this.setState({ errorMessage: 'hubo un problema al guardar el usuario. Intenta mas tarde', isLoading: false });
    }
  }

  delUpdate(userName) {
    this.setState({ isLoading: true });
    Api.deleteReq(Api.USERS_URL + `/${userName}`).then(() => {
        this.setState({ usuarios: undefined, toogleAction: {} });
        this.getUsers();
    }).catch((e) => {
      this.setState({ errorMessage: 'Hubo un problema al borrar el usuario.', isLoading: false });
      console.error(e);
    })
  }

  openModal() {
    this.setState({ modal: !this.state.modal });
  }

  table() {
    if (!this.state.usuarios.length) {
      return <h6>No hay datos</h6>
    }
    return <table className="row-hover">
      <thead>
        <tr>
          <th>
            Nombre
          </th>
          <th>
            UserName
          </th>
          <th>
            Rol
          </th>
          <th>
            Ubicacion
          </th>
          <th>
            Acciones
          </th>
        </tr>
      </thead>
      <tbody>
        {(this.state.usuarios || []).map((user, index) => (
          <tr key={user.userName}>
            <td>{user.nombre}</td>
            <td>{user.userName}</td>
            <td>{user.rol}</td>
            <td>NA/</td>
            <td>
              <a className="btn-floating btn-large" onClick={(e) => { this.toggleActionChange(index); } }>
                <i className="large material-icons">mode_edit</i>
              </a>
              {this.state.toogleAction[index] && <Actions delUpdate={this.delUpdate} isLoading={this.state.isLoading} user={user}/>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  }

  render() {
    return <div id="empleados">
      <h1>
        Vendedores
        <a className="btn-floating btn-large add-new-employee"
            onClick={()=> { this.openModal(); }}
            role="button">
          <i title="Agregar nuevo empleado"
            aria-label="Agregar nuevo empleado"
            className="large material-icons">add</i>
        </a>
      </h1>
      {this.state.errorMessage && <div className="red accent-4 error-msg">{this.state.errorMessage}</div>}
      <Modal open={this.state.modal}
          actions={[
            <Button onClick={this.handleSubmit} disabled={this.isLoading}  node="button" waves="green">
              {!this.isLoading ? <span>Guardar</span> :
                this.isLoading && <span>Cargando...</span>}
            </Button>,
            <Button flat modal="close" node="button" waves="green">Cerrar</Button>
          ]}
          fixedFooter
          options={this.modalOptions}>
        <h3> Agregue un nuevo empleado</h3>
        {this.state.errorMessage && <div className="red accent-4 error-msg">{this.state.errorMessage}</div>}
        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="input-field col s12 m6">
              <input id="employee-name" value={this.state.form.nombre}  onChange={(e) => this.handleChange(e, 'nombre') } type="text"/>
              <label htmlFor="employee-name">Nombre completo</label>
            </div>
            <div className="input-field col s12 m6">
              <input id="employee-email" value={this.state.form.email} onChange={(e) => this.handleChange(e, 'email') } type="email"/>
              <label htmlFor="employee-email">Correo Electronico</label>
            </div>
          </div>
          <div className="row">
            <div className="input-field col s12 m6">
              <input id="username" value={this.state.form.userName} onChange={(e) => this.handleChange(e, 'userName') } type="text"/>
              <label htmlFor="username">Nombre de Usuario (unico)</label>
            </div>
            <Select id="employee-rol"  value={this.state.form.rol} onChange={(e) => this.handleChange(e, 'rol') }>
              <option disabled value="">
              Selecciona el rol
              </option>              
              <option value="user">
                User
              </option>
              <option value="admin">
                Admin
              </option>
            </Select>
          </div>
          <div className="row">
          <div className="input-field col s12 m6">
              <input id="employee-password" type="text" value={this.state.form.password} onChange={(e) => this.handleChange(e, 'password') }/>
              <label htmlFor="employee-password">Contraseña</label>
            </div>
          </div>
        </form>
      </Modal>
    {
      this.state.usuarios ?  this.table() :
        <div className="spinner-container">
          <Spinner/>
        </div>
    }
    </div>
    
  }
}