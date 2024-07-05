import './nota-venta.scss';
import * as moment from 'moment';
import 'moment/locale/es';

export const NotaVenta = (props) => {
  const venta = props.venta || {};
  moment.locale('es');

  
return <div id="nota-venta-print">
  <div className="print-row">
    <h1>Nota de venta</h1>
    <div>
      <h3 className="margin-top-none margin-bottom-none">{moment(venta.fechaVenta).format('LL')}</h3>
    </div>
  </div>
  <div className="print-row">
    <div className="print-left">
      <div className="img-circle">
        <img src="./alphamed-logo.png" alt="alfamed logo"/>
      </div>
      <a className="contacto-links" href="www.alfamedonline.com">www.alfamedonline.com</a>
      <p className="contacto-links">contacto@alfa-med.com.mx</p>
    </div>

    <div className="print-right text-right">
      <h5 className="text-right"><b>ID:</b> {venta.ventaId}</h5>
      <p className="margin-top-none margin-bottom-none contacto-links"><b>Tel:</b> 33 18 14 67 44</p>
      <p className="margin-top-none margin-bottom-none contacto-links"><b>Whats:</b> +52 33 15 84 06 98</p>
      <h6>{}</h6>
    </div>
  </div>
  <div className="table">
    <table>
      <thead>
        <tr>
          <th>Cantidad</th>
          <th>Descripcion</th>
          <th>Descuento</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {venta.articulos.map(a => (<tr>
          <td>{a.cantidad}</td>
          <td>{a.articulo}</td>
          <td>${(a.descuento || 0).toFixed(2)}</td> 
          <td>${(a.total || 0).toFixed(2)}</td>
        </tr>))}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"></td>
          <td><h6>Sub Total</h6></td>
          <td className="print-total">${(venta.subTotal || 0).toFixed(2)}</td>
        </tr> 
        <tr>
          <td colspan="2"></td>
          <td><h6>IVA</h6></td>
          <td className="print-total">${((venta.total - venta.subTotal) || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2"></td>
          <td><h6>Metodo Pago</h6></td>
          <td className="print-total">{venta.metodoPago}</td>
        </tr>
        <tr style={{borderBottom: 'none' }}>
          <td colspan="2"> <h5><i>¡Gracias por su compra!</i></h5></td>
          <td><h6>Total</h6></td>
          <td className="print-total"> <h6>{(venta.total || 0).toFixed(2)}</h6></td>
        </tr>
      </tfoot>
    </table>
  </div>
  {
    (!!venta.nombreDoctor || !!venta.rfc || !!venta.facturaEmail) && <div className="info-de-cliente">
      <h4>Info. de Cliente</h4>
      {!!venta.nombreDoctor && <p><b>Nombre:</b> {venta.nombreDoctor}</p> }
      {!!venta.rfc && <p><b>RFC:</b> {venta.rfc || ''}</p>}
      {!!venta.facturaEmail && <p><b>Correo Electrónico:</b> {venta.facturaEmail} </p>}
    </div>
  }
  </div>  
}