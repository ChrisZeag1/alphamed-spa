import { metodosPago } from '../core/components/sales-form/sales-form';

export const totales =  {
  getConIva: (totalSales) => (
    totalSales.reduce((total, sale) => (
      total + sale.total
    ), 0)
  ),
  getSinIva: (totalSales) => (
    totalSales.reduce((total, sale) => (
      total + sale.subTotal
    ), 0)
  ),
  getByMetodos: function(totalSales) {
    return metodosPago.map((metodo) => ({
      metodo,
      total: this.getConIva(totalSales.filter(sale => sale.metodoPago ===  metodo))
    }))
  }
}