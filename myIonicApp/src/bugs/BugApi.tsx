import axios from 'axios';
import { authConfig, baseUrl, getLogger } from '../core';
import { BugProps } from './BugProps';
import {Plugins} from "@capacitor/core";
import { BugDiff } from './BugDiff';
import { UpdateResult } from './UpdateResult'; 
import { forEachTrailingCommentRange } from 'typescript';
import { sha256 } from 'js-sha256';

const {Storage} = Plugins;


const log = getLogger('itemApi');

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

export const getBugs: (token: string, _id: string, page: number, size: number, solved: boolean | undefined, searchTitle: string, bugs:BugProps[]) => Promise<BugProps[]> = (token, _id, page, size, solved, searchTitle, bugs) => {
  let config = authConfig(token, _id);
  addETagHeader(bugs, config)
  const result = axios.get(bugUrl + `?page=${page}&size=${size}&isSolved=${solved}&titleFilter=${searchTitle}`, config);

  result.then(function (result) {
    result.data.forEach(async (bug: BugProps) => {
      await Storage.set({
        key: String(bug.id!),
        value: JSON.stringify(bug),
      });
    });
  })

  return withLogs(result, 'getBugs');
}

export const createBug: (token: string, _id: string, bug: BugProps) => Promise<BugProps> = (token, _id, bug) => {
  const result = axios.post(bugUrl, bug, authConfig(token, _id))

  result.then(async function (result) {
    await Storage.set({
      key: result.data.id!,
      value: JSON.stringify(result.data),
    });
  });

  return withLogs(result, 'createBug');
}

export const updateBug: (token: string, _id: string, bug: BugProps) => Promise<UpdateResult> = (token, _id, bug) => {
  const result = axios.put(`${bugUrl}/${bug.id}`, bug, authConfig(token, _id))

  result.then(async function (result) {
    await Storage.set({
      key: result.data.id!,
      value: JSON.stringify(result.data),
    });
  });

  return withLogs(result, 'updateBug');
}

export const removeBug: (token: string, _id: string, bug: BugProps) => void = (token, _id, bug) => {
  const result = axios.delete(`${bugUrl}/${bug.id}`, authConfig(token, _id))

  result.then(async function () {
    await Storage.remove({key: String(bug.id!)});
  });

  return withLogs(result, 'deleteBug');
}

export const sendAllBugs: (token: string, _id: string, bugs: BugProps[]) => Promise<BugDiff[]> = (token, _id, bugs) => {
  const result = axios.post(`${bugUrl}/reconnect`, bugs, authConfig(token, _id))
  return withLogs(result, 'sendBugs')
}

function addETagHeader(bugs: BugProps[], config: any): void {
    if (bugs.length === 0) return;
    let etag: string[] = []
    bugs.forEach(bug => {
        let hashValue: string = bug.title + bug.description + bug.version + bug.solved + bug.severity
        etag.push(hashValue)
    });
    config.headers['ETag'] = JSON.stringify(etag)
}

interface MessageData {
  event: string;
  payload: {
    bug: BugProps;
  };
}

export const newWebSocket = (_id: string, onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://${baseUrl}/mobile/api/myHandler`)
  ws.onopen = () => {
    log('web socket onopen');
    ws.send(JSON.stringify({"userId" : _id}));
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
