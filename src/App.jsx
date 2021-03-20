import './App.scss';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom'; 
import { NavBar } from './core/components';
import { Routes } from './core/routes';
import * as Api from './core/api';
import 'materialize-css';

export  class App extends React.Component {

  constructor() {
    super();
    this.state = {
      form: {
        userName: '',
        pword: ''
      },
      user: null,
      loading: false,
      errorMessage: '',
    }
    this.handleLoginSubmit = this.handleLoginSubmit.bind(this);
    this.handleLoginForm = this.handleLoginForm.bind(this); 
  }

  componentDidMount() {
    const user = JSON.parse(localStorage.getItem('am-user'));
    this.setState({ user });
  }

  handleLoginForm(e, formName) {
    this.setState({
      form: {
        ...this.state.form, [formName]: e.target.value ? e.target.value.trim() : e.target.value
      }
    });
  }

  async handleLoginSubmit(e) {
    e.preventDefault();
    this.setState({ loading: true });
    try {
      const user = await Api.post(Api.LOGIN_URL, { ...this.state.form });
      if (user && user.length && user[0].userName) {
        this.setState({ user: user[0], errorMessage: '', loading: false });
        localStorage.setItem('am-user', JSON.stringify(user[0]));
      } else {
        console.error('user >', user);
        this.setState({
          errorMessage: 'usuario o contraseña erronea',
          loading: false
        });
      }
    } catch(e) {
      console.error('error > ', e);
      this.setState({
        errorMessage: 'No se ha poido autenticar, intenta mas tarde',
        loading: false
      });

    }
  }

  render() {
    return (
      <Router>
        { this.state.user && <NavBar rol={this.state.user.rol}/>}
        <Routes {...this.state}
          onSubmit={this.handleLoginSubmit}
          onFormChange={this.handleLoginForm}/>
      </Router>
    );
  }
}

export default App;
