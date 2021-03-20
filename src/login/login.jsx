import { Button } from 'react-materialize';
import { Route } from 'react-router-dom';
import './login.scss';

export default function Login(props) {

  return <div id="login">
    <div className="main-content">
      <div className="row block-cetered">
        <img className="logo" src="./alphamed-logo.png" alt="alfa-med logo"/>
      </div>
      <form onSubmit={props.onSubmit} className="row">
        {props.errorMessage && <div className="red accent-4 error-msg">{props.errorMessage}</div>}
        <div className="input-field col s12 m6">
          <input id="u-name" value={props.form.userName}  onChange={(e) => props.onFormChange(e, 'userName') } type="text"/>
          <label htmlFor="u-name">Nombre Usuario</label>
        </div>
        <div className="input-field col s12 m6">
          <input id="u-password" value={props.form.pword}  onChange={(e) => props.onFormChange(e, 'pword') } type="password"/>
          <label htmlFor="u-password">Contraseña</label>
        </div>
        <div className="row text-centered">
          <Button type="submit" disabled={props.loading}>
            {props.loading ? 'Cargando...': 'Entrar'}
          </Button>
        </div>
      </form>
    </div>

    
  </div>;
}

