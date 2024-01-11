import './nota-venta.scss';

export const NotaVenta = (props) => {


return <div id="nota-venta-print">
<div className="print-row">
  <h1>Nota de venta</h1>
  <h4>Enero 18, 2024</h4>
</div>
<div className="print-row">
  <div className="img-circle">
    <img src="./alphamed-logo.png" alt="alfamed logo"/>
  </div>
  <div className="print-right">
    <h5>Alfa-med </h5>
    <div>Av. copilco #235, las Aguilas, Zapopan, Jal, Mexico</div>
    <h5>Dr. Magania</h5>
    <div>Direction de fatura</div>
    <div>estado, CP</div>
  </div>
</div>
<div className="table">
  <table>
    <thead>
      <tr>
        <th>Cantidad</th>
        <th>Descripcion</th>
        <th>Precio</th>
        <th>Importe</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>2</td>
        <td>Pinzas Ultra slim aas</td>
        <td>$50.00</td>
        <td>$100.00</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2"> <h5>Gracias por su compra!</h5></td>
        <td><h6>Total</h6></td>
        <td className="print-total"> <h6> $110.00</h6></td>
      </tr>
    </tfoot>
  </table>
</div>
</div>  
}