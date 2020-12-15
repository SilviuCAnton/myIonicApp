import React, { useContext, useEffect, useState } from 'react';
import { Redirect, RouteComponentProps } from 'react-router';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList, IonLoading,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  useIonViewDidEnter
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Bug from './Bug';
import { getLogger } from '../core';
import { BugContext } from './BugProvider';
import { AuthContext } from '../auth';
import {Storage, NetworkStatus, Plugins} from "@capacitor/core";
import BugConflict from './BugConflict';
import { BugProps } from './BugProps';

const log = getLogger('BugList');

const { Network } = Plugins;

const size = 12;
let page = 0;
let remaining = 1;
let currentVal: boolean | undefined = undefined;
let searchTitle: string = '';

const initialStatus: NetworkStatus = {connected: true, connectionType: 'wifi'};

const BugList: React.FC<RouteComponentProps> = ({ history }) => {
  
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(initialStatus);
  const { diffs, bugs, fetching, fetchingError, fetchBugs, reloadBugs, sendBugs, solveBugConflict } = useContext(BugContext);
  const {token, logout} = useContext(AuthContext);
  useEffect(networkEffect, [token]);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  function updateNetworkStatus(status: NetworkStatus) {
    setNetworkStatus(status);
  }

  useIonViewDidEnter(async () => {
    console.log('[useIon] calling fetch');
    remaining--;
    if(remaining === 0)
        await fetchBugs?.(page, size, undefined, searchTitle);
  });

  function networkEffect() {
    let canceled = false;
    Network.addListener('networkStatusChange', async (status) => {
        updateNetworkStatus(status)
        if (canceled) {
            return;
        }
        let connected: boolean = status.connected

        if(connected) {
          let bugsToSend: any[] = []

          await Storage.keys().then(function(allkeys) {
            allkeys.keys.forEach(async key => {
              await Storage.get({key}).then(function (it) {
                  if (key !== 'user' && key !== '_id') {
                    const object = JSON.parse(it.value);
                    if (typeof object.title !== 'undefined') {
                      bugsToSend.push(object);
                    }
                  }
                })
            })
          })
          await sendBugs?.(bugsToSend);
        }
    });
    return () => {
        canceled = true;
    };
}

  async function searchNext($event: CustomEvent<void>) {
    page += 1;
    console.log('[SearchNext] calling fetch with page=', page);
    await fetchBugs?.(page, size, currentVal, searchTitle);
    ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  async function selectVal(val: string){
    setFilter(val);
    if(val === 'any')
        currentVal = undefined;
    else
        currentVal = val === "yes";
    await reloadBugs?.(page, size, currentVal, searchTitle);
  }

  async function typeSearchName(val: string){
    searchTitle = val;
    await reloadBugs?.(page, size, currentVal, searchTitle);
  }

  async function solveConflict(chosenVersion: BugProps) {
    await solveBugConflict?.(chosenVersion)
  }

  const handleLogout = () => {
    logout?.();
    return <Redirect to={{pathname: "/login"}}/>;
  };

  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bug app</IonTitle>

  <IonHeader>Current network status: {networkStatus.connected ? "connected" : "disconnected"} type: {networkStatus.connectionType}</IonHeader>

          <IonButton class="ion-margin-end" onClick={handleLogout}>Logout</IonButton>

          <IonSelect value={filter} placeholder={"Select a filter"} onIonChange={e => {page = 0; selectVal(e.detail.value)}}>
            <IonSelectOption value="any">Any</IonSelectOption>
            <IonSelectOption value="yes">Yes</IonSelectOption>
            <IonSelectOption value="no">No</IonSelectOption>
          </IonSelect>

          <IonSearchbar
            value={searchTitle}
            debounce={1000}
            onIonChange={e => {page = 0; typeSearchName(e.detail.value!);}}>
          </IonSearchbar>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonLoading isOpen={fetching} message="Fetching bugs" />
        {diffs && diffs.length > 0 && (
          <><IonHeader>There are conflicts with the server!!</IonHeader>
            <IonText>Please choose a version for the following bugs</IonText>
            <IonList>
              {diffs.map(({ localVersion, serverVersion }) => <BugConflict localVersion={localVersion} serverVersion= {serverVersion} onSolve={solveConflict} ></BugConflict>)}
            </IonList></>
        )}
        {bugs && (typeof diffs === 'undefined' || diffs.length === 0) && (
          <IonList>
            {bugs.map(({ id, title, description, severity, dateReported, solved, version, photo, lat, lng}) =>
              <Bug key={id} id={id} title={title} description = {description} severity = {severity} dateReported = {dateReported} solved= {solved} version = {version} photo = {photo} lat = {lat} lng = {lng} onEdit={id => history.push(`/bugs/${id}`)} />)}
            
            <IonInfiniteScroll threshold="10px" disabled={disableInfiniteScroll} onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
              <IonInfiniteScrollContent loadingText="Loading more items..."></IonInfiniteScrollContent>
            </IonInfiniteScroll>
          </IonList>
        )}
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch bugs'}</div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/bug')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default BugList;
