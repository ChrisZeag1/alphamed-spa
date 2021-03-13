import './nav-bar.scss';
import { NavLink } from 'react-router-dom';
export const NavBar = () => (
  <nav>
  <ul>
    <li id="logo-container">
      <a href="http://www.alfa-med.com.mx/" target="_blank">
        <div className="img-circle">
          <img src="./alphamed-logo.png" alt="alfa-med logo"/>
        </div>
      </a>
    </li>
    <li>
      <NavLink to="/dasboard" activeClassName="selected">
      <i title="dashboard" className="large material-icons">home</i>
      </NavLink>
    </li>
    <li>
      <NavLink to="/empleados" activeClassName="selected">
        <i title="empleados" className="large material-icons">person</i>
      </NavLink>
    </li>
    <li>
      <NavLink to="/invetario" activeClassName="selected">
        <i title="invetorio" className="large material-icons">library_books</i>
      </NavLink>
    </li>
    <li>
      <NavLink to="/ventas" activeClassName="selected">
        <i title="ventas" className="large material-icons">attach_money</i>
      </NavLink>
    </li>
  </ul>
  </nav>
);
