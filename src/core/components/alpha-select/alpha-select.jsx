
import React, { useState } from 'react';
import { Modal } from 'react-materialize';
import { get as _get } from 'lodash';
import './alpha-select.scss';


export const AlphaSelect = (props) => {
  const [openModal, setopenModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const getselectedItem = () => (
    props.items ? props.items.find(i => i.articuloId === props.value) : {
      articulo: '',
      cantidad: ''
    }
  );
  const modalOptions = {
    onCloseStart: () => setopenModal(false)
  };

  const onInputchange = (e) => {
    setSearchValue(e.target.value);
  };

  const onSelected = (item) => {
    if(item.articuloId === 'NA') {
      return;
    }
    setopenModal(false);
    props.onChange && props.onChange(item);
  };

  const applySelectedClass = (item) =>
    props.value ?  'item-selected' : '';

  const Item = (props) => <li onClick={() => onSelected(props.item)}
    className={`collection-item two-blocks ${applySelectedClass(props.item)}`}>
    <span className="item-name">{props.item.articulo}</span>
    {props.item.cantidad && <span className="item-units">{props.item.cantidad} Pzas</span>}
  </li>;

  const availableItems = (items) => {
    if(searchValue) {
      const filtered = items.filter(item => 
        item.articulo.toLowerCase().trim().includes(searchValue.toLowerCase().trim())
      );
      return filtered.length ?
      filtered : [{ articulo: 'sin resultados', articuloId: 'NA' }];
    } else {
      return items;
    }
  }

  return <div className="alpha-select-container">

    <div className="selector-main" onClick={() =>  !props.disabled && setopenModal(true)}>
      {!props.value ? <p>{props.label}</p> :
      <div>{getselectedItem().articulo } ({getselectedItem().cantidad}U)</div>}
      <i className="small material-icons">arrow_drop_down</i>
    </div>

    {!props.disabled &&<Modal open={openModal} options={modalOptions} root={document.body}>
      <p>Selecciona un artículo</p>
      <div className="input-field col s4">
        <input id="search-invetory"
          value={searchValue}
          onChange={(e) => onInputchange(e)}
          type="text"/>
        <label htmlFor="search-invetory">Buscar</label>
      </div>
      <ul className="collection">
        {
          !_get(props.availableItems, 'length') && 
          <li  className="collection-item two-blocks">No hay inventario</li>
        }
        {
          !props.availableItems ? <li className="collection-item">Cargando...</li> :
            availableItems(props.availableItems).map(item => <Item item={item}
              key={item.articuloId}>
            </Item>)
        }
      </ul>
    </Modal>}
  </div>

}