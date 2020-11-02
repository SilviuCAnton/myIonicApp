import axios from 'axios';
import { getLogger } from '../core';
import { BugProps } from './BugProps';

const log = getLogger('itemApi');

const baseUrl = 'localhost:8080';
const bugUrl = `http://${baseUrl}/mobile/api/bugs`;

interface ResponseProps<T> {
  data: T;
}

function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
  log(`${fnName} - started`);
  return promise
    .then(res => {
      log(`${fnName} - succeeded`);
      return Promise.resolve(res.data);
    })
    .catch(err => {
      log(`${fnName} - failed`);
      return Promise.reject(err);
    });
}

const config = {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
};

export const getBugs: () => Promise<BugProps[]> = () => {
  return withLogs(axios.get(bugUrl, config), 'getBugs');
}

export const createBug: (bug: BugProps) => Promise<BugProps> = bug => {
  return withLogs(axios.post(bugUrl, bug, config), 'createBug');
}

export const updateBug: (bug: BugProps) => Promise<BugProps> = bug => {
  return withLogs(axios.put(`${bugUrl}/${bug.id}`, bug, config), 'updateBug');
}

export const removeBug: (bug: BugProps) => void = bug => {
    return withLogs(axios.delete(`${bugUrl}/${bug.id}`, config), 'deleteBug');
}

interface MessageData {
  event: string;
  payload: {
    bug: BugProps;
  };
}

export const newWebSocket = (onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://${baseUrl}/mobile/api/myHandler`)
  ws.onopen = () => {
    log('web socket onopen');
  };
  ws.onclose = () => {
    log('web socket onclose');
  };
  ws.onerror = error => {
    log('web socket onerror', error);
  };
  ws.onmessage = messageEvent => {
    log('web socket onmessage');
    onMessage(JSON.parse(messageEvent.data));
  };
  return () => {
    ws.close();
  }
}
