import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { BugProps } from './BugProps';
import { createBug, getBugs, newWebSocket, updateBug, removeBug, sendAllBugs } from './BugApi';
import { AuthContext } from '../auth';
import {Storage, Plugins, NetworkStatus, StoragePluginWeb} from "@capacitor/core";
import { bug } from 'ionicons/icons';
import { connected } from 'process';
import { BugDiff } from './BugDiff';

const log = getLogger('BugProvider');

const defaultNetworkStatus: NetworkStatus = {connected: true, connectionType: 'wifi'};

type SaveBugFn = (bug: BugProps) => Promise<any>;
type DeleteBugFn = (bug: BugProps) => Promise<any>;
type FetchBugsFn = (page: number, size: number, isSolved: boolean | undefined, searchTitle: string) => Promise<any>;
type ReloadBugsFn = (page: number, size: number, isSolved: boolean | undefined, searchTitle: string) => Promise<any>;
type SendBugsFn = (bugs: BugProps[]) => Promise<any>;
type SolveBugConflictFn = (bugs: BugProps) => Promise<any>;

export interface BugsState {
  bugs?: BugProps[],
  diffs?: BugDiff[],
  fetching: boolean,
  saving: boolean,
  deleting: boolean,
  sending: boolean,
  solving: boolean,
  sendingError?: Error | null,
  savingError?: Error | null,
  deletingError?: Error | null,
  fetchingError?: Error | null,
  solvingError?: Error| null,
  sendBugs?: SendBugsFn,
  saveBug?: SaveBugFn,
  deleteBug?: DeleteBugFn,
  fetchBugs?: FetchBugsFn,
  reloadBugs?: ReloadBugsFn,
  solveBugConflict?: SolveBugConflictFn
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: BugsState = {
  fetching: false,
  saving: false,
  deleting: false,
  sending: false,
  solving: false
};

const FETCH_BUGS_STARTED = 'FETCH_BUGS_STARTED';
const FETCH_BUGS_SUCCEEDED = 'FETCH_BUGS_SUCCEEDED';
const FETCH_BUGS_FAILED = 'FETCH_BUGS_FAILED';
const RELOAD_BUGS_SUCCEEDED = 'RELOAD_BUGS_SUCCEEDED';
const SAVE_BUG_STARTED = 'SAVE_BUG_STARTED';
const SAVE_BUG_SUCCEEDED = 'SAVE_BUG_SUCCEEDED';
const SAVE_BUG_FAILED = 'SAVE_BUG_FAILED';
const DELETE_BUG_STARTED = 'DELETE_BUG_STARTED';
const DELETE_BUG_SUCCEEDED = 'DELETE_BUG_SUCCEEDED';
const DELETE_BUG_FAILED = 'DELETE_BUG_FAILED';
const SEND_BUGS_STARTED = 'SEND_BUGS_STARTED';
const SEND_BUGS_SUCCEEDED = 'SEND_BUGS_SUCCEEDED';
const SEND_BUGS_FAILED = 'SEND_BUGS_FAILED';
const SOLVE_CONFLICT_STARTED = 'SOLVE_CONFLICT_STARTED';
const SOLVE_CONFLICT_SUCCEEDED = 'SOLVE_CONFLICT_SUCCEEDED';
const SOLVE_CONFLICT_FAILED = 'SOLVE_CONFLICT_FAILED';

const reducer: (state: BugsState, action: ActionProps) => BugsState =
  (state, { type, payload }) => {
    switch (type) {
      case FETCH_BUGS_STARTED:
        return { ...state, fetching: true, fetchingError: null };

      case FETCH_BUGS_SUCCEEDED:
        const bugList = [...(state.bugs || [])];
        return {...state, bugs: bugList.concat(payload.bugs), fetching: false};

      case FETCH_BUGS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      
      case RELOAD_BUGS_SUCCEEDED: 
        return {...state, bugs: payload.bugs, fetching: false};
      
      case SAVE_BUG_STARTED:
        return { ...state, savingError: null, saving: true };
      
      case SAVE_BUG_SUCCEEDED:
        const bugs = [...(state.bugs || [])];
        const bug = payload.bug;
        const index = bugs.findIndex(bg => bg.id === bug.id);
        if (index === -1) {
          bugs.unshift(bug)
        } else {
          bugs[index] = bug;
        }
        return { ...state, bugs, saving: false };

      case SAVE_BUG_FAILED:
        return { ...state, savingError: payload.error, saving: false };

      case DELETE_BUG_STARTED:
        return {...state, deletingError: null, deleting: true};

      case DELETE_BUG_SUCCEEDED:
        const allBugs = [...(state.bugs || [])];
        const theBug = payload.bug;
        if(allBugs.find(bg => bg.id === theBug.id)) {
          const foundIndex = allBugs.findIndex(bg => bg.id === theBug.id);
          allBugs.splice(foundIndex, 1);
        }
        return { ...state, bugs: allBugs, deleting: false };

      case DELETE_BUG_FAILED:
        return { ...state, savingError: payload.error, deleting: false };

      case SEND_BUGS_STARTED:
        return { ...state, sending: true, sendingError: null };

      case SEND_BUGS_SUCCEEDED:
        return {...state, diffs: payload.foundDiffs, sending: false};

      case SEND_BUGS_FAILED:
        return { ...state, sendingError: payload.error, sending: false };

      case SOLVE_CONFLICT_STARTED:
        return { ...state, solving: true, solvingError: null };
      
      case SOLVE_CONFLICT_SUCCEEDED:
        const allConflicts = [...(state.diffs || [])];
        const solvedConflictBug = payload.savedBug;
        const newDiffs = allConflicts.filter(diff => diff.serverVersion.id! !== solvedConflictBug.id)

        const myBugList = [...(state.bugs || [])].filter(bug => typeof bug.dateReported !== "undefined")
        return {...state, bugs: myBugList, solving: false, solvingError: null, diffs: newDiffs}

      case SOLVE_CONFLICT_FAILED:
        return { ...state, solvingError: payload.error, solving: false };
      
      default:
        return state;
    }
  };

export const BugContext = React.createContext<BugsState>(initialState);

interface BugProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const BugProvider: React.FC<BugProviderProps> = ({ children }) => {
  const { token, _id } = useContext(AuthContext)
  const [state, dispatch] = useReducer(reducer, initialState);
  const { solving, solvingError, bugs, diffs, fetching, fetchingError, saving, deleting, savingError, deletingError, sending } = state;
  useEffect(wsEffect, [token]);
  const saveBug = useCallback<SaveBugFn>(saveBugCallback, [token]);
  const deleteBug = useCallback<DeleteBugFn>(deleteBugCallback, [token]);
  const sendBugs = useCallback<SendBugsFn>(sendBugsCallback, [token]);
  const solveBugConflict = useCallback<SolveBugConflictFn>(solveConflictCallback, [token]);
  const value = { solving, sending, bugs, diffs, fetching, fetchingError, solvingError, saving, deleting, savingError, deletingError, saveBug, deleteBug, reloadBugs, fetchBugs, sendBugs, solveBugConflict };

  log('returns');
  return (
    <BugContext.Provider value={value}>
      {children}
    </BugContext.Provider>
  );

  async function fetchBugs(page: number, size: number, isSolved: boolean | undefined, searchTitle: string) {
    if(!token?.trim()){
        return;
    }

    try {
        log('fetchBugs started');
        dispatch({type: FETCH_BUGS_STARTED});
        const bugs = await getBugs(token, (await Storage.get({key : '_id'})).value, page, size, isSolved, searchTitle);
        log('fetchBugssucceeded');
        dispatch({type: FETCH_BUGS_SUCCEEDED, payload: {bugs}});
    } catch (error) {
        log('fetchBugs failed');
        alert("OFFLINE!");
        const storageBugs: any[] = [];
        await Storage.keys().then(function (allKeys) {
            allKeys.keys.forEach((key) => {
                Storage.get({key}).then(function (it) {
                    try {
                        const object = JSON.parse(it.value);
                        let isSolvedFilter = true;
                        if(isSolved !== undefined){
                            isSolvedFilter = object.solved === isSolved;
                        }
                        let titleFilter = true;
                        if(searchTitle !== ''){
                            titleFilter = new RegExp(`^${searchTitle}`).test(object.title);
                        }
                        if (String(object.userId) === String(_id) && isSolvedFilter && titleFilter)
                            storageBugs.push(object);
                    } catch (e) {
                    }
                });
            })
        });
        dispatch({type: RELOAD_BUGS_SUCCEEDED, payload: {bugs: storageBugs}});
    }
  }

  async function reloadBugs(offset: number, size: number, isSolved: boolean | undefined, searchTitle: string) {
    if(!token?.trim()){
        return;
    }
    try {
        log(`reloadBugs started with searchName = ${searchTitle}`);
        dispatch({type: FETCH_BUGS_STARTED});
        const bugs = await getBugs(token, (await Storage.get({key : '_id'})).value, 0, offset + size, isSolved, searchTitle);
        log('reloadBugs succeeded');
        dispatch({type: RELOAD_BUGS_SUCCEEDED, payload: {bugs}});
    } catch (error) {
        log('reloadBugs failed');
        alert("OFFLINE!");
        const storageBugs: any[] = [];
        await Storage.keys().then(function (allKeys) {
            allKeys.keys.forEach((key) => {
                Storage.get({key}).then(function (it) {
                    try {
                        const object = JSON.parse(it.value);
                        let isSolvedFilter = true;
                        if(isSolved !== undefined){
                            isSolvedFilter = object.solved === isSolved;
                        }
                        let titleFilter = true;
                        if(searchTitle !== ''){
                          titleFilter = new RegExp(`^${searchTitle}`).test(object.name);
                        }
                        if (String(object.userId) === String(_id) && isSolvedFilter && titleFilter)
                            storageBugs.push(object);
                    } catch (e) {
                    }
                });
            })
        });
        dispatch({type: RELOAD_BUGS_SUCCEEDED, payload: {bugs: storageBugs}});
    }
  }

  async function saveBugCallback(bug: BugProps) {
    try {
      log('saveBug started');
      dispatch({ type: SAVE_BUG_STARTED });
      const savedBug = await (bug.id ? updateBug(token, (await Storage.get({key : '_id'})).value, bug) : createBug(token, (await Storage.get({key : '_id'})).value, bug));
      log('saveBug succeeded');
      dispatch({ type: SAVE_BUG_SUCCEEDED, payload: { bug: savedBug } });
    } catch (error) {
      log('saveBug failed');
      alert("OFFLINE!");
      bug.id = bug.id ? bug.id : Date.now()
      await Storage.set({
          key: String(bug.id),
          value: JSON.stringify(bug)
      });
      dispatch({type: SAVE_BUG_SUCCEEDED, payload: {bug}});
    }
  }

  async function deleteBugCallback(bug: BugProps) {
      try {
        log('deleteBug started');
        dispatch({ type: DELETE_BUG_STARTED });
        await removeBug(token, (await Storage.get({key : '_id'})).value, bug);
        log('deleteBug succeded');
        dispatch({ type: DELETE_BUG_SUCCEEDED, payload: { bug }});
      } catch (error) {
          log('deleteBug failed');
          alert("OFFLINE!");
          await Storage.remove({
              key: String(bug.id)
          });
        dispatch({type: DELETE_BUG_SUCCEEDED, payload: {bug}});
      }
  }

  async function sendBugsCallback(bugs: BugProps[]) {
    try {
      log('sendBugs started');
      dispatch({ type: SEND_BUGS_STARTED });
      const foundDiffs = await sendAllBugs(token, (await Storage.get({key : '_id'})).value, bugs);
      log('sendBugs succeded');
      dispatch({ type: SEND_BUGS_SUCCEEDED, payload: { foundDiffs }});
    } catch (error) {
      log('sendBugs failed');
      dispatch({type: SEND_BUGS_FAILED, payload: {bugs}});
    }
  }

  async function solveConflictCallback(version: BugProps) {
    try {
      log('solveConflict started');
      dispatch({ type: SOLVE_CONFLICT_STARTED });
      const savedBug = await updateBug(token, (await Storage.get({key : '_id'})).value, version)
      log('solveConflict succeded');
      dispatch({ type: SOLVE_CONFLICT_SUCCEEDED, payload: { savedBug }});
    } catch (error) {
      log('solveConflict failed');
      dispatch({type: SOLVE_CONFLICT_FAILED, payload: {version}});
    }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    const closeWebSocket = newWebSocket(_id, message => {
      if (canceled) {
        return;
      }
      const { event, payload: { bug }} = message;
      log(`ws message, bug ${event}`);
      if (event === 'created' || event === 'updated') {
        bug.dateReported = new Date(bug.dateReported);
        dispatch({ type: SAVE_BUG_SUCCEEDED, payload: { bug } });
      }
      if(event === 'deleted') {
        bug.dateReported = new Date(bug.dateReported);
        dispatch({type: DELETE_BUG_SUCCEEDED, payload: { bug }});
      }
    });
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket?.();
    }
  }
}
