const ENV = process.env.REACT_APP_SECRET_ENV || 'test';

export const ENVS = {
  test: 'https://2kageu1blh.execute-api.us-east-2.amazonaws.com/test',
  prod: 'https://yraz3bydyd.execute-api.us-east-2.amazonaws.com/prod'
};

export const USERS_URL = `${ENVS[ENV]}/users`;
export const INVENTARIO_URL = `${ENVS[ENV]}/inventario`;
export const VENTAS_URL = `${ENVS[ENV]}/ventas`;
export const LOGIN_URL = `${ENVS[ENV]}/login`;
export const PERIODS_URL = `${ENVS[ENV]}/periods`;
export const VIATICOS_URL = `${ENVS[ENV]}/viaticos`;