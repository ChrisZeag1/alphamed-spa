import './App.scss';
import { BrowserRouter as Router } from 'react-router-dom'; 
import { NavBar } from './core/components';
import { Routes } from './routes';
import 'materialize-css';

export  function App() {
  return (
    <Router>
      <NavBar></NavBar>
      <Routes></Routes>
    </Router>
  );
}

export default App;
