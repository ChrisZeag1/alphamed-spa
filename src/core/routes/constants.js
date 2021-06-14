// manager routes
import ManagerDashbard from '../../manager-dashboard/manager-dashboard';
import Empleados from '../../empleados/empleados';
import Inventario from '../../inventario/inventario';
import Ventas from '../../ventas/ventas'
import Viaticos from '../../viaticos/viatcos';
// employee routes
import EmpleadoInventario from '../../empleado-invetario/emplado-invetario';
import EmpleadoVentas from '../../empleado-ventas/empleado-ventas'
import EmpleadoViaticos  from '../../empleado-viaticos/empleado-viaticos';
import MisVentas from '../../mis-ventas/mis-ventas';


export const EMPLOYEE_ROUTES = [
  { path:'/dasboard', render: <h1>Dashboard</h1>, icon: 'home', name: 'Dasboard' },
  { path:'/invetario', render: <EmpleadoInventario/>, icon: 'library_books', name: 'Invetario' },
  { path:'/venta', render: <EmpleadoVentas/>, icon: 'add_shopping_cart', name: 'Vender' },
  { path:'/ventas', render: <MisVentas/>, icon: 'attach_money', name: 'Mis ventas' },
  { path:'/viaticos', render: <EmpleadoViaticos/>, icon: 'card_travel', name: 'Mis Viaticos' },
];

export const MANAGER_ROUTES = [
  { path:'/dasboard', render: <ManagerDashbard/>, icon: 'home', name: 'Dasboard' },
  { path:'/empleados', render: <Empleados/>, icon: 'person', name: 'Empleados' },
  { path:'/invetario', render: <Inventario/>, icon: 'library_books', name: 'Invetario'  },
  { path:'/ventas', render: <Ventas/>, icon: 'attach_money', name: 'ventas' },
  { path:'/viaticos', render: <Viaticos/>, icon: 'card_travel', name: 'Viaticos' },
];