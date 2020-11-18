import React, { useContext, useState } from 'react';
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
  IonTitle,
  IonToolbar,
  useIonViewDidEnter
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Bug from './Bug';
import { getLogger } from '../core';
import { BugContext } from './BugProvider';
import { AuthContext } from '../auth';

const log = getLogger('BugList');

const size = 12;
let page = 0;
let remaining = 0;
let currentVal: boolean | undefined = undefined;
let searchTitle: string = '';

const BugList: React.FC<RouteComponentProps> = ({ history }) => {
  
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
  const { bugs, fetching, fetchingError, fetchBugs, reloadBugs } = useContext(BugContext);
  const {token, logout} = useContext(AuthContext);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  useIonViewDidEnter(async () => {
    console.log('[useIon] calling fetch');
    remaining--;
    if(remaining === 0)
        await fetchBugs?.(page, size, undefined, searchTitle);
  });

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
        {bugs && (
          <IonList>
            {bugs.map(({ id, title, description, severity, dateReported, solved}) =>
              <Bug key={id} id={id} title={title} description = {description} severity = {severity} dateReported = {dateReported} solved= {solved} onEdit={id => history.push(`/bugs/${id}`)} />)}
            
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
