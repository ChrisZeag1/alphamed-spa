import { Switch, Route, Redirect } from 'react-router-dom';
import React from 'react';
import Login from '../../login/login';
import { Button } from 'react-materialize';
import { EMPLOYEE_ROUTES, MANAGER_ROUTES } from './constants';

const NavRoutes = (props) => {
  const routes = props.user.rol === 'admin' ? MANAGER_ROUTES : EMPLOYEE_ROUTES;

  return <Switch>
    {routes.map(r => <Route key={r.path} path={r.path}>
      <div className="page">
        {r.render}
        {r.path === '/dasboard' &&
            <Button onClick={props.handleLogout}>Cerrar sesión</Button>}
      </div>
    </Route>)}
    <Route path="*"
      render={() => (<Redirect to={props.user.rol === 'admin' ? '/empleados' : '/ventas'}/>)}>
    </Route>
  </Switch>
};


export const Routes = (props) => <React.Fragment>
  {!props.user && <Switch>
    <Route path="/login">
      <div className="page">
        <Login {...props}
          onSubmit={props.onSubmit}
          onFormChange={props.onFormChange}/>
      </div>
    </Route>
    <Route path="*"
      render={() => <Redirect to="/login"/>}>
    </Route>
  </Switch>}

  {props.user && <NavRoutes
    user={props.user}
    handleLogout={props.handleLogout}
  />}
</React.Fragment>;
