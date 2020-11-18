import axios, { AxiosResponse } from 'axios';
import { baseUrl, config, withHeaderLogs, withLogs } from '../core';

const authUrl = `http://${baseUrl}/mobile/api/login`;

export interface AuthProps {
  accesstoken: string;
  userid: string;
}

export const login: (username?: string, password?: string) => Promise<AuthProps> = (username, password) => {
  console.log("HEADERS")
  let response = axios.post(authUrl, { username, password }, config)
  response.then(res => console.log(JSON.stringify(res.headers)))

  return withHeaderLogs(axios.post(authUrl, { username, password }, config), 'login');
}
