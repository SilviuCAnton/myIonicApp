import React, { useContext } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList, IonLoading,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Bug from './Bug';
import { getLogger } from '../core';
import { BugContext } from './BugProvider';

const log = getLogger('BugList');

const BugList: React.FC<RouteComponentProps> = ({ history }) => {
  const { bugs, fetching, fetchingError } = useContext(BugContext);
  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bug app</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching bugs" />
        {bugs && (
          <IonList>
            {bugs.map(({ id, title, description, severity}) =>
              <Bug key={id} id={id} title={title} description = {description} severity = {severity} onEdit={id => history.push(`/bugs/${id}`)} />)}
            {/* <IonFab vertical="center" horizontal="end" slot="fixed">
                <IonFabButton onClick={() => }>
                    <IonIcon icon={remove} />
                </IonFabButton>
            </IonFab> */}
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
