import * as Api from '../core/api';
import React from 'react';

export default class ManagerDashboard extends React.Component {
  componentDidMount() {
    this.getUsers();
  }
  
  getUsers() {
    Api.get(Api.USERS_URL).then((res) => {
      console.log('users >>', res);
    })
  }

  render() {
    return <div>
      <h1>DASHBORD</h1>;
    </div> 
  }
}