import './nota-venta.scss';
import * as moment from 'moment';
import 'moment/locale/es';

export const NotaVenta = (props) => {
  const venta = props.venta || {};
  moment.locale('es');

  
return <div id="nota-venta-print">
  <div className="print-row">
    <h1 className="margin-top-none">Nota de venta</h1>
    <div>
      <h4 className="margin-top-none">{moment(venta.fechaVenta).format('LL')}</h4>
        <h5 className="text-right">ID: {venta.ventaId}</h5>
    </div>
  </div>
  <div className="print-row">
    <div className="print-left">
      <div className="img-circle">
        <img src="./alphamed-logo.png" alt="alfamed logo"/>
      </div>
      <a href="www.alfamedonline.com">www.alfamedonline.com</a>
      <div><a href="mailto:contacto@alfa-med.com.mx">contacto@alfa-med.com.mx</a></div>
    </div>

    <div className="print-right text-right">
      <p className="margin-top-none">Tel: 33 18 14 67 44</p>
      <p className="margin-top-none">Whats: +52 33 15 84 06 98</p>
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
        <tr>
          <td colspan="2"> <h5>Gracias por su compra!</h5></td>
          <td><h6>Total</h6></td>
          <td className="print-total"> <h6>{(venta.total || 0).toFixed(2)}</h6></td>
        </tr>
      </tfoot>
    </table>
  </div>
  <div className="info-de-cliente">
    <h5>Info. de Cliente</h5>
    <p>Nombre: {venta.nombreDoctor}</p> 
    <p> RFC: {venta.rfc || ''}</p>
    <p>Correo Electrónico: {venta.facturaEmail} </p>
  </div>
</div>  
}