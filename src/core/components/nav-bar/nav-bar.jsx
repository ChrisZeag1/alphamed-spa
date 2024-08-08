import './nav-bar.scss';
import { NavLink } from 'react-router-dom';
import { EMPLOYEE_ROUTES, MANAGER_ROUTES } from '../../routes';

export const NavBar = (props) => {
  const routes = props.rol === 'admin' ? MANAGER_ROUTES : EMPLOYEE_ROUTES;
  return <nav>
    <ul>
      <li id="logo-container">
        <a href="http://www.alfamedonline.com/" target="_blank">
          <div className="img-circle">
            <img src="./alphamed-logo.png" alt="alfa-med logo"/>
          </div>
        </a>
      </li>
      {
        routes.map(r => <li key={r.path}>
          <NavLink to={r.path} className={({isActive}) => isActive ? 'selected' : ''}>
          <i title={r.name} className="large material-icons">{r.icon}</i>
          </NavLink>
        </li>)
      }
    </ul>
  </nav>
};
