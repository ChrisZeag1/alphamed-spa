import React from 'react';
import * as Api from '../core/api';
import { Spinner, PeriodsSector, PeriodsModel } from '../core/components';
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
      currentPeriod: null,
      periods: [],
      isDeleteLoading: false,
      isSubmitLoading: false,
      errorMessage: '',
      successMessage: '',
      isModalOpen: false,
      form: {
        ...this.newViaticoEmptyFrom
      },
      totalViaticos: null,
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
    await this.getPeriods();
    await this.getViaticos();
    document.querySelectorAll('.datepicker-done').forEach((el) => {
      el.addEventListener('click', this.onDoneDate.bind(this), null);
    });
  }

  async getViaticos() {
    this.setState({ viaticos: null });
    const startOfWeek = this.state.currentPeriod.startDate;
    const endOfWeek = this.state.currentPeriod.endDate;
    const fromToQuery = `?fromDate=${startOfWeek}&toDate=${endOfWeek}`;
    try {
      const viaticos = await Api.get(`${Api.VIATICOS_URL}/${this.userName}${fromToQuery}`);
      const totalViaticos = viaticos.reduce((acc, viatico) => (
        acc + viatico.total
      ), 0);
      this.setState({ viaticos: viaticos.sort(this.sortViatico), totalViaticos });
    } catch(e) {
      console.error(e);
      this.setState({errorMessage: 'hubo un problema al obtener tus viaticos. Intenta de nuevo.', viaticos: [] });
    }
  }

  async getPeriods() {
    try {
      const periods = await Api.get(`${Api.PERIODS_URL}`);
      const dateRanges = new PeriodsModel(periods);
      const prevPeriodSelection = JSON.parse(localStorage.getItem('currentPeriod'));
      await this.setState({ periods: dateRanges, currentPeriod: prevPeriodSelection || dateRanges[0] });
    } catch(e) {
      this.setState({ errorMessage: 'Hubo un problema al obtener las corridas' });
      console.error(e);
    } 
  }

  async setCurrentPeriodAndGetNewViaticos(currentPeriod) {
    await this.setState({ currentPeriod });
    await this.getViaticos();
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
        <h3> Nuevo cargo</h3>
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
                    this.isLoading && <span>Cargando...</span>}
                </Button>,
                <Button flat modal="close" node="button" waves="green">Cerrar</Button>
              ]}>
        {this.getForm()}
      </Modal>
      <div className="header">
        <h1>Mis viaticos</h1>
        <div className="filters">
          {!!this.state.periods.length && <PeriodsSector
              periods={this.state.periods}
              initPeriod={this.state.currentPeriod}
              setCurrentPeriod={(currentPeriod) => this.setCurrentPeriodAndGetNewViaticos(currentPeriod) }>
            </PeriodsSector>}
        </div>
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
                <div><b>Lugar:</b>{viatico.lugar}</div>
                <div><b>Concepto:</b> {viatico.concepto}</div>
                <div><b>Total:</b> $ {viatico.total} MXN</div>
              </div>
            </CollapsibleItem>)}
          </Collapsible>
      }
      <div className="summary-section">
        <h3>Resumen</h3>
        {this.state.totalViaticos === undefined ? <Spinner/> :
          <ul className="collection with-header col s12 m3">
            <li className="collection-header bluish"><h5>Total</h5></li>
            <li className="collection-item">
              <p><b>Viáticos usados: </b> <span>$ {this.state.totalViaticos}</span></p>
            </li>
          </ul>} 
      </div>
    </div>
  }
}