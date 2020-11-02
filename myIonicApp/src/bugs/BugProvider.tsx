import React, { useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { BugProps } from './BugProps';
import { createBug, getBugs, newWebSocket, updateBug, removeBug } from './BugApi';

const log = getLogger('BugProvider');

type SaveBugFn = (bug: BugProps) => Promise<any>;
type DeleteBugFn = (bug: BugProps) => Promise<any>;

export interface BugsState {
  bugs?: BugProps[],
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  deleting: boolean,
  savingError?: Error | null,
  deletingError?: Error | null,
  saveBug?: SaveBugFn,
  deleteBug?: DeleteBugFn
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: BugsState = {
  fetching: false,
  saving: false,
  deleting: false,
};

const FETCH_BUGS_STARTED = 'FETCH_BUGS_STARTED';
const FETCH_BUGS_SUCCEEDED = 'FETCH_BUGS_SUCCEEDED';
const FETCH_BUGS_FAILED = 'FETCH_BUGS_FAILED';
const SAVE_BUG_STARTED = 'SAVE_BUG_STARTED';
const SAVE_BUG_SUCCEEDED = 'SAVE_BUG_SUCCEEDED';
const SAVE_BUG_FAILED = 'SAVE_BUG_FAILED';
const DELETE_BUG_STARTED = 'DELETE_BUG_STARTED';
const DELETE_BUG_SUCCEEDED = 'DELETE_BUG_SUCCEEDED';
const DELETE_BUG_FAILED = 'DELETE_BUG_FAILED';

const reducer: (state: BugsState, action: ActionProps) => BugsState =
  (state, { type, payload }) => {
    switch (type) {
      case FETCH_BUGS_STARTED:
        return { ...state, fetching: true, fetchingError: null };

      case FETCH_BUGS_SUCCEEDED:
        return { ...state, bugs: payload.bugs, fetching: false };

      case FETCH_BUGS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      
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
      
      default:
        return state;
    }
  };

export const BugContext = React.createContext<BugsState>(initialState);

interface BugProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const BugProvider: React.FC<BugProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { bugs, fetching, fetchingError, saving, deleting, savingError, deletingError } = state;
  useEffect(getBugsEffect, []);
  useEffect(wsEffect, []);
  const saveBug = useCallback<SaveBugFn>(saveBugCallback, []);
  const deleteBug = useCallback<DeleteBugFn>(deleteBugCallback, []);
  const value = { bugs, fetching, fetchingError, saving, deleting, savingError, deletingError, saveBug, deleteBug };
  log('returns');
  return (
    <BugContext.Provider value={value}>
      {children}
    </BugContext.Provider>
  );

  function getBugsEffect() {
    let canceled = false;
    fetchBugs();
    return () => {
      canceled = true;
    }

    async function fetchBugs() {
      try {
        log('fetchBugs started');
        dispatch({ type: FETCH_BUGS_STARTED });
        const bugs = await getBugs();
        log('fetchBugs succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_BUGS_SUCCEEDED, payload: { bugs } });
        }
      } catch (error) {
        log('fetchBugs failed');
        dispatch({ type: FETCH_BUGS_FAILED, payload: { error } });
      }
    }
  }

  async function saveBugCallback(bug: BugProps) {
    try {
      log('saveBug started');
      dispatch({ type: SAVE_BUG_STARTED });
      const savedBug = await (bug.id ? updateBug(bug) : createBug(bug));
      log('saveBug succeeded');
      dispatch({ type: SAVE_BUG_SUCCEEDED, payload: { bug: savedBug } });
    } catch (error) {
      log('saveBug failed');
      dispatch({ type: SAVE_BUG_FAILED, payload: { error } });
    }
  }

  async function deleteBugCallback(bug: BugProps) {
      try {
        log('deleteBug started');
        dispatch({ type: DELETE_BUG_STARTED });
        await removeBug(bug);
        log('deleteBug succeded');
        dispatch({ type: DELETE_BUG_SUCCEEDED, payload: {bug}});
      } catch (error) {
          log('deleteBug failed');
          dispatch({type: DELETE_BUG_FAILED, payload: { error}});
      }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    const closeWebSocket = newWebSocket(message => {
      if (canceled) {
        return;
      }
      const { event, payload: { bug }} = message;
      log(`ws message, bug ${event}`);
      if (event === 'created' || event === 'updated') {
        dispatch({ type: SAVE_BUG_SUCCEEDED, payload: { bug } });
      }
      if(event === 'deleted') {
        dispatch({type: DELETE_BUG_SUCCEEDED, payload: { bug }});
      }
    });
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket();
    }
  }
};
