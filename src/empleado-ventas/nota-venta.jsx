import './nota-venta.scss';
import * as moment from 'moment';
import 'moment/locale/es';

const formatCurrency = (value) => {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const NotaVenta = (props) => {
  const venta = props.venta || {};
  moment.locale('es');

  return (
    <div id="nota-venta-print">
      <div className="print-row">
        <h1>Nota de venta - ID: {venta.ventaId}</h1>
        <div>
          <h3 className="margin-top-none margin-bottom-none">
            {moment(venta.fechaVenta).format('LL')}
          </h3>
        </div>
      </div>
      <div className="print-row">
        <div className="print-left">
          <div className="img-circle">
            <img src="./alphamed-logo.png" alt="alfamed logo" />
          </div>
          <a className="contacto-links" href="http://www.alfamedonline.com">www.alfamedonline.com</a>
          <p className="contacto-links">contacto@alfa-med.com.mx</p>
        </div>
        <div className="print-right text-right">
          <p className="margin-top-none margin-bottom-none contacto-links"><b>Tel:</b> 33 18 14 67 44</p>
          <p className="margin-top-none margin-bottom-none contacto-links"><b>Whatsapp:</b> 33 15 84 06 98</p>
        </div>
      </div>
      <div className="header-info">
        <p><b>Cliente:</b> {venta.nombreDoctor}</p>
        <p><b>Asesor de Ventas:</b> {venta.nombreUsuario}</p>
      </div>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th width="20%">Cantidad</th>
              <th width="20%">Descripción</th>
              <th width="20%"> Precio Unitario</th>
              <th width="20%">Descuento</th>
              <th width="20%">Total</th>
            </tr>
          </thead>
          <tbody>
            {venta.articulos.map((a, index) => (
              <tr key={index}>
                <td>{a.cantidad}</td>
                <td>{a.articulo}</td>
                <td>${formatCurrency(a.total / a.cantidad)}</td>
                <td>${formatCurrency(a.descuento || 0)}</td>
                <td>${formatCurrency(a.total || 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2"></td>
              <td><h6><b>Método Pago:</b> {venta.metodoPago}</h6></td>
              <td><h6><b>Sub Total</b></h6></td>
              <td className="print-total">${formatCurrency(venta.subTotal || 0)}</td>
            </tr>
            <tr>
              <td colSpan="3"></td>
              <td><h6><b>IVA</b></h6></td>
              <td className="print-total">${formatCurrency(venta.total - venta.subTotal || 0)}</td>
            </tr>
            <tr style={{ borderBottom: 'none' }}>
              <td colSpan="3"></td>
              <td><h6><b>Total</b></h6></td>
              <td className="print-total"><h6>${formatCurrency(venta.total || 0)}</h6></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}