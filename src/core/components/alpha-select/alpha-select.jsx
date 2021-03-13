
import React, { useState } from 'react';
import { Modal } from 'react-materialize';
import './alpha-select.scss';


export const AlphaSelect = (props) => {
  const [openModal, setopenModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedItem, setSelectedItem] = useState('');

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
    setSelectedItem(item);
    setopenModal(false);
    props.onChange && props.onChange(item);
  };

  const applySelectedClass = (item) =>
    selectedItem && selectedItem.articuloId === item.articuloId ? 
      'item-selected' : '';

  const Item = (props) => <li onClick={() => onSelected(props.item)}
    className={`collection-item two-blocks ${applySelectedClass(props.item)}`}>
    <span className="item-name">{props.item.articulo}</span>
    {props.item.cantidad && <span className="item-units">{props.item.cantidad} U</span>}
  </li>;

  const availableItems = (items) => {
    if(searchValue) {
      const reg = new RegExp(searchValue, 'g');
      const filtered = items.filter(item => reg.test(item.articulo));
      return filtered.length ?
      filtered : [{ articulo: 'sin reslutadaos', articuloId: 'NA' }];
    } else {
      return items;
    }
  }

  return <div className="alpha-select-container">

    <div className="selector-main" onClick={() => setopenModal(true)}>
      {!selectedItem ? <p>{props.label}</p> :
      <div>{selectedItem.articulo } ({selectedItem.cantidad}U)</div>}
      <i className="small material-icons">arrow_drop_down</i>
    </div>

    <Modal open={openModal} options={modalOptions}>
      <p>Selectiona un Articulo</p>
      <div className="input-field col s4">
        <input id="search-invetory"
          value={searchValue}
          onChange={(e) => onInputchange(e)}
          type="text"/>
        <label htmlFor="search-invetory">Buscar</label>
      </div>
      <ul className="collection">
        {
          !props.items ? <li className="collection-item">Loading...</li> :
            availableItems(props.items).map(item => <Item item={item}
              key={item.articuloId}>
            </Item>)
        }
      </ul>
    </Modal>
  </div>

}