const ENV = 'test';

export const MAIN_URI =  'https://2kageu1blh.execute-api.us-east-2.amazonaws.com/';
export const ENVS = {
  test: 'test'
};

export const USERS_URL = `${MAIN_URI}${ENVS[ENV]}/users`;
export const INVENTARIO_URL = `${MAIN_URI}${ENVS[ENV]}/inventario`;
export const VENTAS_URL = `${MAIN_URI}${ENVS[ENV]}/ventas`;
export const LOGIN_URL = `${MAIN_URI}${ENVS[ENV]}/login`;
export const PERIODS_URL = `${MAIN_URI}${ENVS[ENV]}/periods`;
export const VIATICOS_URL = `${MAIN_URI}${ENVS[ENV]}/viaticos`;