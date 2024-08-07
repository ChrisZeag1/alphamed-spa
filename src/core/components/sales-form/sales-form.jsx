import React from 'react';
import { AlphaSelect } from '../alpha-select/alpha-select';
import { Select, Checkbox, Collapsible, CollapsibleItem, Icon, Textarea } from 'react-materialize';
import { METODOS_PAGO } from './metodo-pagos';
import { get as _get } from 'lodash';
import './sales-form.scss';

export const iVA_VALUE = 1.16;
export const metodosPago = [
  METODOS_PAGO.TPV,
  METODOS_PAGO.EFECTIVO,
  METODOS_PAGO.TRANSFERENCIA,
  METODOS_PAGO.CHEQUES
];

export class SalesForm extends React.Component {
  articulo = {
    articuloId: '',
    cantidad: '',
    descuento: '',
    total: 0
  };
  constructor(props) {
    super(props);
    this.setNewArticulo = this.setNewArticulo.bind(this);
    this.formId = props.ventaId || 0;
  }

  sortArticulo(a, b) {
    return a.articulo < b.articulo ? -1 : a.articulo === b.articulo ? 0 : 1;
  }

  deleteProducto(index) {
    const deletedArt = this.props.articulos[index];
    // deletedArt.total cuando es venta indivual 
    const aritculoPrecioTotal = deletedArt.total || (deletedArt.cantidad * deletedArt.precio) - deletedArt.descuento;
    const produInventrio = this.props.inventario.find(a => a.articuloId === deletedArt.articuloId);

    if (this.props.ventaId){
      produInventrio.cantidad += deletedArt.cantidad;
    }

    const newArticulos = [
      ...this.props.articulos.slice(0, index),
      ...this.props.articulos.slice(index + 1, this.props.articulos.length),
    ];

    const newAvailableInventario = [
      ...this.props.availableInventario,
      produInventrio
    ].sort(this.sortArticulo);

    this.props.updateState({
      availableInventario: newAvailableInventario,
      articulos: newArticulos,
      subTotal: this.props.subTotal - aritculoPrecioTotal,
      total: this.props.total - aritculoPrecioTotal
    });
  }

  toogleIva() {
    const hasIVA = !this.props.IVA;
    let total = this.props.subTotal;
    if (hasIVA) {
      total = this.props.subTotal * iVA_VALUE;
    }
    return this.props.updateState({ IVA: hasIVA,  total });
  }

  async setMetodoPago(metodoPago) {
    const hasIva = metodoPago === METODOS_PAGO.TPV;
    if(hasIva && !this.props.IVA) {
      await this.toogleIva();
    } else if(!hasIva && this.props.IVA) {
      await this.toogleIva();
    }
    this.props.setFormField({ metodoPago });
  }

  setNewArticulo(articulo, index) {
    let newArticulos;
    let newAvailableInventario = this.props.availableInventario;
    let currentArticulos = [...this.props.articulos];
    const inventario = _get(this.props, 'inventario', []);
    
    if (typeof index !== 'number') {
      currentArticulos.push(articulo);
      index = currentArticulos.length - 1;
    } else if(articulo.articuloId) {
      currentArticulos = [
        ...currentArticulos.slice(0, index),
        {
         ...this.articulo,
         articuloId: articulo.articuloId
        },
        ...currentArticulos.slice(index + 1, currentArticulos.length),
      ]
    }

    if (articulo.cantidad) {
      const id = currentArticulos[index].articuloId;
      const articuloEnInvetorio = inventario.find(a =>
        a.articuloId === id
      );
      articulo.cantidad = articulo.cantidad > 0 ? articulo.cantidad : 0;
      articulo.cantidad = articulo.cantidad <= articuloEnInvetorio.cantidad ?
        articulo.cantidad : articuloEnInvetorio.cantidad;
    }

    const newArt = { ...currentArticulos[index], ...articulo };

    const cantidad = _get(newArt, 'cantidad', 0);
    const descuento = _get(newArt, 'descuento', 0)
    const articuloEnInvetorio = inventario.find(a =>
      a.articuloId === currentArticulos[index].articuloId
    );

    const total = (cantidad * _get(articuloEnInvetorio, 'precio', 0)) - descuento;

    newArt.total = total;

    if (articulo.articuloId) {
      const artIndex = this.props.availableInventario
      .findIndex((item) => item.articuloId === articulo.articuloId);

      if (_get(this.props.articulos[index], 'articuloId')) {
        newAvailableInventario.push(articuloEnInvetorio);
      }

      newAvailableInventario = [
        ...this.props.availableInventario.slice(0, artIndex),
        ...this.props.availableInventario.slice(artIndex + 1, this.props.availableInventario.length),
      ]
      .sort(this.sortArticulo)
      .filter(i => i.cantidad);
    }

    newArticulos = [
      ...currentArticulos.slice(0, index),
      newArt,
      ...currentArticulos.slice(index + 1, currentArticulos.length),
    ];

    const newSubTotal = newArticulos.reduce((acc, current) =>
      acc + (typeof current.total === 'number' ? current.total : this.getItemTotal(current))
    , 0);

    let newTotal = newSubTotal;

    if (this.props.IVA) {
      newTotal = newSubTotal * iVA_VALUE;
    }

    this.props.updateState({
      articulos: newArticulos,
      availableInventario: newAvailableInventario,
      subTotal: newSubTotal,
      total: newTotal
    });
  }

  getItemTotal(articulo) {
    const cantidad = _get(articulo, 'cantidad', 0);
    const precio =  _get(articulo, 'precio', 0);
    const descuento = _get(articulo, 'descuento', 0);
    return  ((cantidad * precio) - (descuento));
  }

  getProducto(articulo, i) {
    return <div className={'row producto col s12 m5 '}
      id={`producto-${articulo.articuloId}`} key={`producto-${i}`}>
      {articulo.articuloId && !this.props.form.isReadMode && <div role="button"
          onClick={()=> this.deleteProducto(i)}
          className="producto-delete"
          aria-label="Eliminar producto">
        <i title="Eliminar producto" className="small material-icons">clear</i>
      </div>}
      <div className="col s11">
      {this.props.inventario ? <AlphaSelect
          className="col s12 m6"
          availableItems={this.props.availableInventario}
          disabled={this.props.form.isReadMode}
          items={this.props.inventario}
          value={articulo.articuloId}
          onChange={(item) => this.setNewArticulo({ articuloId: item.articuloId, articulo: item.articulo }, i)}
          label={'Producto'}>
        </AlphaSelect> : 
        <div className="producto-container">
          <div>{articulo.articulo}</div>
          <i className="small material-icons">arrow_drop_down</i>
        </div> }
      </div>
      <div className="input-field col s4">
        <input value={articulo.cantidad}
          id={`cantidad-${i}-${this.formId}`}
          disabled={!articulo.articuloId || this.props.form.isReadMode}
          onChange={(e) => this.setNewArticulo({ cantidad: e.target.value ? +e.target.value : ''  }, i)}
          type="number"/>
        <label className={articulo.cantidad ? 'active' : ''} htmlFor={`cantidad-${i}-${this.formId}`}>
          Cantidad
        </label>
      </div>
      <div className="input-field col s4">
        <input value={articulo.descuento}
          id={`descuento-${i}-${this.formId}`}
          disabled={!articulo.articuloId || this.props.form.isReadMode}
          onChange={(e) => this.setNewArticulo({ descuento: e.target.value ? +e.target.value : '' }, i)}
          type="number"/>
        <label className={typeof articulo.x === 'number' ? 'active' : ''}   htmlFor={`descuento-${i}-${this.formId}`}>
          Descuento
        </label>
      </div>
      <div className="input-field col s4">
        <input value={`$ ${ _get(articulo, 'total', 0).toFixed(2)}`} type="text" disabled/>
        <label className={articulo.total ? 'active' : ''} className="active">total</label>
      </div>
    </div>
  }

  render() {
    return <form className="sales-form" onSubmit={(e) => this.props.onSubmitForm(e) }>
      <div className="row">
        <div className="input-field col s12 m6">
          <input id={`doctors-name-${this.formId}`}
            value={this.props.form.nombreDoctor}
            disabled={this.props.form.isReadMode}
            onChange={(e) => this.props.setFormField({ nombreDoctor: e.target.value })}
            type="text"/>
          <label className={this.props.form.nombreDoctor ? 'active' : ''} htmlFor={`doctors-name-${this.formId}`}>
            Nombre del doctor
          </label>
        </div>
      </div>

      <div className="productos-venta row">
        <p>Productos:</p>
        {this.props.articulos.map((articulo, i) => this.getProducto(articulo, i))}
        {!this.props.form.isReadMode ?
          this.getProducto(this.articulo) : ''
        }
      </div>

      <div className="row venta-factura">
        <Collapsible popout accordion>
          <CollapsibleItem expanded={false}
            icon={<Icon>local_offer</Icon>}
            header="Datos Factura"
            node="div">
            <div className="input-field">
              <input value={this.props.form.facturaEmail}
                id={`factura-email-${this.formId}`}
                disabled={this.props.form.isReadMode}
                onChange={(e) => this.props.setFormField({ facturaEmail: e.target.value })}
                type="email"/>
              <label className={this.props.form.facturaEmail ? 'active' : ''} htmlFor={`factura-email-${this.formId}`}>
                Correo electrónico
              </label>
            </div>
            <div className="input-field">
              <input value={this.props.form.rfc}
                id={`factura-rfc-${this.formId}`}
                disabled={this.props.form.isReadMode}
                onChange={(e) => this.props.setFormField({ rfc: e.target.value })}
                type="text"/>
              <label className={this.props.form.rfc ? 'active' : ''}  htmlFor={`factura-rfc-${this.formId}`}>
                RFC
              </label>
            </div>
          </CollapsibleItem>
          <CollapsibleItem expanded={false}
            icon={<Icon>note_add</Icon>}
            header="Nota"
            node="div">
            <div className="text-area">
              <Textarea value={this.props.form.nota}
                disabled={this.props.form.isReadMode}
                id={`venta-nota-${this.formId}`}
                onChange={(e) => this.props.setFormField({ nota: e.target.value })}/>
            </div>
          </CollapsibleItem>            
        </Collapsible>
      </div>

      <div className="row venta-footer">
        <div className="selector-search col s6">
          <Select disabled={this.props.form.isReadMode} value={this.props.form.metodoPago} onChange={(e) => this.setMetodoPago(e.target.value) }>
            <option disabled defaultValue selected value=""> Metodo </option>
            {metodosPago.map(metodo => (<option key={metodo} value={metodo}>{metodo}</option>))}
          </Select>
        </div>
        <div className="totals col s6">
          <div className="col s12 venta-iva">
          <Checkbox label="Iva"
            id={this.props.ventaId ? this.props.ventaId : 'select-122'}
            value={(!!this.props.IVA) + ''}
            checked={!!this.props.IVA}
            disabled={this.props.form.metodoPago === METODOS_PAGO.TPV }
            onChange={() => this.toogleIva()}/>
          </div>
          <div className="input-field col s12">
            <input value={`$ ${this.props.subTotal && this.props.subTotal.toFixed(2)}`} type="text" disabled/>
            <label className="active">Sub total</label>
          </div>
          <div className="input-field col s12">
            <input value={`$ ${this.props.total ? this.props.total.toFixed(2) : 0}`} type="text" disabled/>
            <label className="active">Total</label>
          </div>
        </div>
      </div>
      <div className="row text-centered sales-actions">
        {this.props.children}
      </div>
    </form>
  }
};