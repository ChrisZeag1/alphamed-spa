import React from 'react';
import * as Api from '../core/api';
import { Spinner } from '../core/components';
import './inventario.scss';
import { Button, Modal } from 'react-materialize';
const STATIC_FIELDS = ['articulo', 'precio', 'articuloId'];

export default class Inventario extends React.Component {
  newItemFrom = {
    articulo: '',
    precio: '',
  };
  selectedUser = {};

  constructor(props) {
    super(props)
    this.state = {
      inventario: undefined,
      dynamicFields: [],
      isLoading: false,
      isEditMode: false,
      isModalOpen: false,
      errorMessage: '',
      tobeSaved: {},
      newItemFrom: {}
    };
    this.handleSubmitNewItem = this.handleSubmitNewItem.bind(this);
    this.modalOptions = {
      onCloseStart: () => this.setState({ isModalOpen: false, newItemFrom: { ...this.newItemFrom }, errorMessage: '' })
    };
  }
  
  componentDidMount() {
    this.selectedUser = {
      name: this.getQueryParam('name'),
      userName: this.getQueryParam('userName')
    };
    this.getInventario();
  }

  async toggleEditMode() {
    await this.setState({ isEditMode: !this.state.isEditMode });
    if (this.state.isEditMode) {
      const { dynamicFields } = this.state;
      const dynamicFieldsWithHist = dynamicFields.reduce((acc, field) =>
      acc.concat([field, field + '_HISTO'])
      , []);
      this.setState({
        dynamicFields: dynamicFieldsWithHist
      });
    } else {
      this.setState({
        dynamicFields: this.getDynamicFields(this.state.inventario)
      });
    }
  }

  getQueryParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
  }

  async getInventario() {
    this.setState({ inventario: null });
    try {
      const inventario = await Api.get(Api.INVENTARIO_URL);
      let dynamicFields = this.getDynamicFields(inventario);

      const newItemFromFields = dynamicFields.reduce((acc, fieldName) => {
        acc[fieldName] = '';
        return acc;
      }, {});
      this.newItemFrom = {
        ...this.newItemFrom,
        ...newItemFromFields,
      }

      if(this.selectedUser.userName) {
        dynamicFields = dynamicFields
          .filter(fieldName => fieldName === this.selectedUser.userName)
        dynamicFields.push(this.selectedUser.userName + '_HISTO');
        await this.setState({ isEditMode: true });
      }      

      this.setState({
        inventario: inventario.sort(this.sortArticulo),
        dynamicFields,
        isLoading: false,
        errorMessage: null
      });

    } catch(e) {
      this.setState({ errorMessage: e.message, isLoading: false })
    }
  }

  openModal() {
    this.setState({ isModalOpen: true });
  }

  getDynamicFields(inventario) {
    return Object.keys(inventario[0])
      .filter(key => !STATIC_FIELDS.includes(key))
      .filter(fieldName => !fieldName.includes('_HISTO'));
  }

  handleFormFieldChange(e, formFieldName) {
    const isNumber = [...this.state.dynamicFields, 'precio'].includes(formFieldName);
    const value = isNumber ? +e.target.value : e.target.value;
    this.setState({ newItemFrom: { ...this.state.newItemFrom, [formFieldName]: value } });
  }


  async handleChange(newValue, item, df) {
    const newItem = {
      [df]: newValue,
      articuloId: item.articuloId
    };
    if(this.state.dynamicFields.includes(df)) {
      newItem[`${df}_HISTO`] = newValue;
    }

    const itemIndex = this.state.inventario.findIndex(value =>value.articuloId === item.articuloId);
    const newInventario = [
      ...this.state.inventario.slice(0, itemIndex),
      { ...item, ...newItem },
      ...this.state.inventario.slice(itemIndex+1, this.state.inventario.length),
    ];
    const tobeSaved = {
      ...this.state.tobeSaved,
      [item.articuloId]: {
        ...(this.state.tobeSaved[item.articuloId] || {}),
        ...newItem
      }
    };
    await this.setState({
      inventario: newInventario,
      tobeSaved
    });
    console.log('state >', this.state);
  }

  async saveChangeAndUpdate() {
    if(!Object.values(this.state.tobeSaved).length) {
      await this.toggleEditMode();
      return;
    }
    this.setState({ isLoading: true });
    try {
      const update = await Api.put(Api.INVENTARIO_URL, Object.values(this.state.tobeSaved));
      if (update) {
        await this.setState({ tobeSaved: {} });
        await this.toggleEditMode();
        await this.getInventario();
      }
    }catch(e) {
      this.setState({ errorMessage: e.message, isLoading: false })
    }
  }

  async deleteItemAndUpdate(item) {
    this.setState({ isLoading: true });
    try {
      const deleted = await Api.deleteReq(Api.INVENTARIO_URL + `/${item.articuloId}`);
      if (deleted) {
        this.getInventario();
      }
    } catch(e) {
      this.setState({ errorMessage: e.message, isLoading: false })
    }
  }

  async handleSubmitNewItem() {
    this.setState({ isLoading: true });
    try {
      const postNew = await Api.post(Api.INVENTARIO_URL, [this.state.newItemFrom]);
      if (postNew) {
        this.setState({ isModalOpen: false, isLoading: false });
        this.getInventario();
      }
    } catch(e) {
      this.setState({ errorMessage: e.message, isLoading: false })
    }
  }

  sortArticulo(a, b) {
    return a.articulo < b.articulo ? -1 : a.articulo === b.articulo ? 0 : 1;
  }

  table() {
    return <table className="row-hover row">
      <thead>
        <tr>
          <th>Articulo</th>
          <th>precio</th>
          {this.state.dynamicFields.map(field =>
            <th key={field}>{ this.selectedUser.name && !field.includes('_HISTO') ? 'Cantidad' : 'Inventario Original'}</th>
          )}
          {this.state.isEditMode && <th>Acciones</th> }
        </tr>
      </thead>
      <tbody>
        {(this.state.inventario || []).map(item => <tr key={item.articuloId}>
          <td>{
            (!this.state.isEditMode || this.selectedUser.name)  ? item.articulo : 
              <input type="text" value={item.articulo} onChange={(e) => this.handleChange(e.target.value, item, 'articulo') }/>
          }</td>

          <td>${
            (!this.state.isEditMode || this.selectedUser.userName) ? item.precio :
              <input className="width-80" type="number" value={item.precio} onChange={(e) => this.handleChange(+e.target.value, item, 'precio') }/>
          } MXN</td>

          {this.state.dynamicFields
            .map(df =>
              <td key={item.articuloId + ' ' + df}>
                {
                  !this.state.isEditMode || df.includes('_HISTO') ? <span>{item[df]}</span> : 
                    <input type="number" value={item[df]} onChange={(e) => this.handleChange(+e.target.value, item, df) }/>
                }
              </td>
          )}

          {this.state.isEditMode && <td><Button
              className="red lighten-2"
              onClick={() => this.deleteItemAndUpdate(item)}
              icon={<i className="small material-icons">Borrar</i>}>
          </Button></td>}
        </tr>)}
      </tbody>
    </table>
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

  render() {
    const ButtonSave = () => <Button onClick={()=> this.saveChangeAndUpdate()}>
      {!this.state.isLoading ?
        <span>Guardar</span> :
        <span>Cargando...</span>}
    </Button>;

    return <div id="inventario">
      <h1>
        Inventario
        {!this.state.isEditMode ? <span>
          <a className="btn-floating btn-large"
              onClick={() => this.openModal()}
              role="button">
            <i title="Agregar nuevo artículo"
              aria-label="Agregar nuevo artículo"
              className="large material-icons">add</i>
          </a>
          <a className="btn-floating btn-large"
            role="button" onClick={() =>  this.toggleEditMode()}>
            <i title="modo editar"
              aria-label="modo editar"
              className="large material-icons">mode_edit </i>
          </a>
        </span> :
        <ButtonSave/>
       }
      </h1>
      {this.selectedUser.name && <h5>Viendo para:  <span className="user-name-filter">{ this.selectedUser.name }</span></h5>}
       {this.message()}
       <Modal options={this.modalOptions}
              open={this.state.isModalOpen}
              actions={[
                <Button onClick={this.handleSubmitNewItem} disabled={this.isLoading}  node="button" waves="green">
                  {!this.isLoading ? <span>Guardar</span> :
                    this.isLoading && <span>Cargando...</span>}
                </Button>,
                <Button flat modal="close" node="button" waves="green">Cerrar</Button>
              ]}
              fixedFooter>
          <h3>Agregar un nuevo artículo </h3>
          <form onSubmit={this.handleSubmitNewItem}>
            <div className="row">
              {Object.keys(this.newItemFrom).map(fieldName => <div key={fieldName} className="input-field col s12 m6">
                <input id={fieldName}
                    value={this.state.newItemFrom[fieldName]} 
                    onChange={(e) => this.handleFormFieldChange(e, fieldName) }
                    type={ [...this.state.dynamicFields, 'precio'].includes(fieldName) ? 'number': 'text'}/>
                <label htmlFor={fieldName}>{fieldName}</label>
              </div>)}
            </div>
          </form>
       </Modal>
      {this.state.inventario ? this.table() : <Spinner/>}
      {this.state.isEditMode && <div className="row right-content">
      <ButtonSave/>
        </div>}
    </div>;
  }
}