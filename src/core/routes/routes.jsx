import { Switch, Route, Redirect } from 'react-router-dom';
import React from 'react';
import Login from '../../login/login';
import { EMPLOYEE_ROUTES, MANAGER_ROUTES } from './constants';

const NavRoutes = (props) => {
  const routes = props.user.rol === 'admin' ? MANAGER_ROUTES : EMPLOYEE_ROUTES;

  return <Switch>
    {routes.map(r => <Route key={r.path} path={r.path}>
      <div className="page">
        {r.render}
      </div>
    </Route>)}
  </Switch>
};

export const Routes = (props) => <React.Fragment>
  <Route path="*"
    render={() => (
        props.user ?
        <Redirect to={props.user.rol === 'admin' ? '/empleados' : '/ventas'}/> :
        <Redirect to="/login"/> 
      )
    }
  />
  <Route path="/login">
    <div className="page">
      <Login {...props}
        onSubmit={props.onSubmit}
        onFormChange={props.onFormChange}/>
    </div>
  </Route>
  {props.user && <NavRoutes user={props.user}/>}
</React.Fragment>;
