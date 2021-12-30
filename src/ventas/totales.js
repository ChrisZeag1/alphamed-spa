import { metodosPago } from '../core/components/sales-form/sales-form';

export const totales =  {
  getConIva: (totalSales, username) => {
    return (!username ? totalSales :
      totalSales.filter(sale => sale.userName === username))
    .reduce((total, sale) => (
      total + sale.total
    ), 0)
  },
  getSinIva: (totalSales, username) => (
    (!username ? totalSales :
      totalSales.filter(sale => sale.userName === username))    
    .reduce((total, sale) => (
      total + sale.subTotal
    ), 0)
  ),
  getByMetodos: function(totalSales, username) {
    return metodosPago.map((metodo) => ({
      metodo,
      total: this.getConIva((!username ? totalSales :
        totalSales.filter(sale => sale.userName === username))
        .filter(sale =>
          (sale.metodoPago || sale.form.metodoPago) ===  metodo
        ))
    }))
  }
}