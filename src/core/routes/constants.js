import ManagerDashbard from '../../manager-dashboard/manager-dashboard';
import Empleados from '../../empleados/empleados';
import Inventario from '../../inventario/inventario';
import EmpleadoInventario from '../../empleado-invetario/emplado-invetario';
import EmpleadoVentas from '../../empleado-ventas/empleado-ventas'
import Ventas from '../../ventas/ventas'

export const EMPLOYEE_ROUTES = [
  { path:'/invetario', render: <EmpleadoInventario/>, icon: 'library_books', name: 'invetario' },
  { path:'/ventas', render: <EmpleadoVentas/>, icon: 'attach_money', name: 'ventas' },
  { path:'/dasboard', render: <h1>Dashboard</h1>, icon: 'home', name: 'dasboard' }
];

export const MANAGER_ROUTES = [
  { path:'/empleados', render: <Empleados/>, icon: 'person', name: 'empleados' },
  { path:'/invetario', render: <Inventario/>, icon: 'library_books', name: 'invetario'  },
  { path:'/ventas', render: <Ventas/>, icon: 'attach_money', name: 'ventas' },
  { path:'/dasboard', render: <ManagerDashbard/>, icon: 'home', name: 'dasboard' }
];