import { Switch, Route } from 'react-router-dom';

import ManagerDashbard from './manager-dashboard/manager-dashboard';
import Empleados from './empleados/empleados';
import Inventario from './inventario/inventario';
import EmpleadoInventario from './empleado-invetario/emplado-invetario';
import EmpleadoVentas from './empleado-ventas/empleado-ventas';

export const Routes = () => (
<Switch>
  <Route path="/empleados">
    <div className="page">
      <Empleados/>
    </div>
  </Route>

  <Route path="/invetario">
    <div className="page">
      <Inventario/>
      {/* <EmpleadoInventario/> */}
    </div>
  </Route>

  <Route path="/ventas">
    <div className="page">
      <EmpleadoVentas/>
    </div>
  </Route>

  <Route path="/dasboard">
    <Home />
  </Route>

</Switch>
);


function Home() {
  return <ManagerDashbard/>;
}
