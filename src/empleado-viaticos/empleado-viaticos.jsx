import React from 'react';
import * as Api from '../core/api';
import { Spinner } from '../core/components';
import { Collapsible, CollapsibleItem, Button, Modal, DatePicker, Checkbox } from 'react-materialize';
import { datePickerOptions } from '../core/components/date-picker/date-picker-options';
import * as moment from 'moment';
import './empleado-viaticos.scss';
import { get as _get } from 'lodash';

export default class EmpleadoViaticos extends React.Component {
  userName;
  fechaVenta;
  newViaticoEmptyFrom = {
    concepto: '',
    fecha: moment().format('YYYY-MM-DD HH:mm:ss'),
    lugar: '',
    tarjetas: false,
    total: null
  };
  datePickerOptions;


  constructor(props) {
    super(props);
    this.state = {
      viaticos: null,
      startOfPeriod: '',
      isDeleteLoading: false,
      isSubmitLoading: false,
      errorMessage: '',
      successMessage: '',
      isModalOpen: false,
      form: {
        ...this.newViaticoEmptyFrom
      }
    };
    this.datePickerOptions = {
      ...datePickerOptions,
      defaultDate: new Date(this.newViaticoEmptyFrom.fecha),
      onSelect: (e) => this.onDateChange(e)
    }
    this.modalOptions = {
      onCloseStart: () => this.setState({ isModalOpen: false, form: { ...this.newViaticoEmptyFrom }, errorMessage: '' })
    };
  }

  async componentDidMount() {
    this.userName = _get(JSON.parse(localStorage.getItem('am-user')), 'userName');
    await this.getPeriod();
    await this.getViaticos();
    document.querySelectorAll('.datepicker-done').forEach((el) => {
      el.addEventListener('click', this.onDoneDate.bind(this), null);
    });
  }

  async getViaticos() {
    this.setState({ viaticos: null });
    const startOfWeek = moment(this.state.startOfPeriod).startOf('day').startOf('week').format('YYYY-MM-DD HH:mm:ss');
    const endOfWeek = moment().endOf('day').endOf('week').format('YYYY-MM-DD HH:mm:ss');
    const fromToQuery = `?fromDate=${startOfWeek}&toDate=${endOfWeek}`;
    try {
      const viaticos = await Api.get(`${Api.VIATICOS_URL}/${this.userName}${fromToQuery}`);
      this.setState({ viaticos: viaticos.sort(this.sortViatico) });
    } catch(e) {
      console.error(e);
      this.setState({errorMessage: 'hubo un problema al obtener tus viaticos. Intenta de nuevo.', viaticos: [] });
    }
  }

  async getPeriod() {
    try {
      const startOfPeriod = await Api.get(`${Api.PERIODS_URL}/latest`);
      const defualtPastDate = moment().subtract(14, "days").format('YYYY-MM-DD HH:mm:ss')
      this.setState({ startOfPeriod:  startOfPeriod || defualtPastDate });
    } catch(e) {
      const defualtPastDate = moment().subtract(14, "days").format('YYYY-MM-DD HH:mm:ss')
      this.setState({ startOfPeriod: defualtPastDate });
      console.error(e);
      this.setState({errorMessage: `Hubo un problema al obtener la fecha de incio de la corrida. Intenta mas tarde.` });
    }
  }

  async deleteViatico({ viaticoId }, index) {
    try {
      this.setState({isDeleteLoading: true });
      const deleted = await Api.deleteReq(`${Api.VIATICOS_URL}/${this.userName}/${viaticoId}`);
      if (deleted) {
        const newViaticos = [
          ...this.state.viaticos.slice(0, index),
          ...this.state.viaticos.slice(index + 1, this.state.viaticos.length)
        ].sort(this.sortViatico);
        this.setState({isDeleteLoading: false, viaticos: newViaticos });
      }
    } catch(e) {
      console.error(e);
      this.setState({errorMessage: 'Hubo un problema al borra el Viatico.', isDeleteLoading: false });
    }
  }

  setFormField(formValues) {
    this.setState( { form: {
      ...this.state.form,
      ...formValues
    }});
  }

  onDateChange(date) {
    this.fechaVenta = moment(date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
  }

  onDoneDate() {
    this.setState({ form: { ...this.state.form, fecha: this.fechaVenta } })
  }

  sortViatico(a, b) {
    return moment(a.fecha) < moment(b.fecha) ? -1 : moment(a.fecha) === moment(b.fecha) ? 0 : 1;
  }

  async handleSubmit(e) {
    e.preventDefault();
    const { form } = this.state;
    this.setState({ isSubmitLoading: true });
    try {
      const result = await Api.post(`${Api.VIATICOS_URL}/${this.userName}`, form);
      if (result.viaticoId) {
        this.setState({
          isSubmitLoading: false,
          isModalOpen: false,
          viaticos: [...this.state.viaticos, { ...result, tarjetas: result.tarjetas + '' }].sort(this.sortViatico),
          successMessage: 'Viatico Guardado',
          errorMessage: ''
        });
      }
    } catch(e) {
      console.error(e);
      this.setState({ isSubmitLoading: false, errorMessage: 'Hubo un problema al guardar el viatico, itenta mas tarde.',  successMessage: ''});
    }
  }

  getViaticosHeader(viatico) {
    return <div className="viatico-header">
      <div className="to-left">ID: {viatico.viaticoId}</div>
      <div className="to-right">
        <div className="sumary-el main">
        {moment(viatico.fecha).format('ll')}
        </div>
        <div className="sumary-el money">
        $ {viatico.total} MXN
        </div>
      </div>
    </div>
  }
  

  getForm() {
    return <form className="viaticos-form" onSubmit={(e) => this.handleSubmit(e) }>
      <div className="row">
        <h3> Nuevo Viatco</h3>
      </div>
      <div className="row">
        <div className="col s12 m6" id="fecha-viatico">
        <label>Fecha</label>
          <DatePicker options={this.datePickerOptions}/>
        </div>
        <div className="input-field col s12 m6">
          <input id="lugar"
            value={this.state.form.lugar}
            onChange={(e) => this.setFormField({ lugar: e.target.value })}
            type="text"/>
          <label className={this.state.form.lugar ? 'active' : ''} htmlFor="lugar">
            Lugar
          </label>
        </div>
        <div className="input-field col s12 m6">
          <input id="concepto"
            value={this.state.form.concepto}
            onChange={(e) => this.setFormField({ concepto: e.target.value })}
            type="text"/>
          <label className={this.state.form.concepto ? 'active' : ''} htmlFor="concepto">
            Concepto
          </label>
        </div>
        <div className="input-field col s9 m4" id="viaticos-total-form">
          $ <input id="viaticos-total"
            value={this.state.form.total}
            onChange={(e) => this.setFormField({ total: +e.target.value })}
            type="number"/> MXN
          <label className="active" htmlFor="viaticos-total">
            Total
          </label>
        </div>
      </div>
    </form>
  }

  render() {
    return <div id="empleado-viaticos">
      {
        this.state.errorMessage && <div id="error-message" className="red accent-4 error-msg message">
          {this.state.errorMessage}
        </div>
      }
      {
       this.state.successMessage && <div id="success-message" className="teal accent-4 success-msg message">
          {this.state.successMessage}
        </div>
      }
      <Modal open={this.state.isModalOpen}
              options={this.modalOptions}
              fixedFooter
              actions={[
                <Button onClick={(e) => this.handleSubmit(e)} disabled={this.isLoading}  node="button" waves="green">
                  {!this.isLoading ? <span>Guardar</span> :
                    this.isLoading && <span>Loading...</span>}
                </Button>,
                <Button flat modal="close" node="button" waves="green">Cerrar</Button>
              ]}>
        {this.getForm()}
      </Modal>
      <div className="header">
        <h1>Mis Vitacos</h1>
        <div className="row text-centered">
        <button className="btn waves-effect waves-light"
              onClick={() => this.setState({ isModalOpen: true }) }
              role="button">
            <i className="large material-icons">add</i>
            Agregar nuevo
          </button>
        </div>
      </div>
      {
        !this.state.viaticos ? <Spinner/> : <Collapsible popout className="main-header" accordion>
          {this.state.viaticos.map((viatico, index) =>
            <CollapsibleItem key={viatico.viaticoId} header={this.getViaticosHeader(viatico)}>
              <div className="content">
                <div className={`viatico-delete ${this.isDeleteLoading ? 'disabled' : ''}`}
                     role="button"
                     onClick={() => this.deleteViatico(viatico, index)}
                     aria-label="eliminar viatico">
                  <i title="eliminar viatico" className="small material-icons">clear</i>
                </div>
                <div><b>lugar:</b>{viatico.lugar}</div>
                <div><b>concepto:</b> {viatico.concepto}</div>
                <div><b>total:</b> $ {viatico.total} MXN</div>
              </div>
            </CollapsibleItem>)}
          </Collapsible>
      }
    </div>
  }
}