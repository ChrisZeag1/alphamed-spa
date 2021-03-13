import axios from 'axios';

export async function post(url, body, heads={}, queryParams) {
  const headers =  { ...heads, 'Content-Type': 'application/json' };
  const params = queryParams ? objToUrl(queryParams) : '';
  return resolve(axios.post(url + params, body, { headers }))
}

export async function get(url, body, heads={}) {
  const fullUrl = url + (body ? objToUrl(body) : '');
  const headers =  { ...heads, 'Content-Type': 'application/json' };
  return resolve(axios.get(fullUrl, { headers }))
}

export async function deleteReq(url, heads={}) {
  const headers =  {
    ...heads,
    'Content-Type': 'application/json',
    uname: 'fer_0310'
  };
  return resolve(axios.delete(url, { headers }))
}

export async function put(url, body, heads={}) {
  const headers =  {
    ...heads,
    'Content-Type': 'application/json',
    uname: 'fer_0310'
  };
  return resolve(axios.put(url, body, { headers }))
}

function objToUrl(body) {
  var str = [];
  for (var p in body) {
    if (body.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(body[p]));
    }
  }
  return '?' + str.join('&');
}

async function resolve(promise) {
  const response = await promise;
  return response.data;
}