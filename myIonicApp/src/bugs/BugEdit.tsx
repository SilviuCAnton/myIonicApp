import React, { useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { getLogger } from '../core';
import { BugContext } from './BugProvider';
import { RouteComponentProps } from 'react-router';
import { BugProps } from './BugProps';

const log = getLogger('BugEdit');

interface BugEditProps extends RouteComponentProps<{
  id?: string;
}> {}

const BugEdit: React.FC<BugEditProps> = ({ history, match }) => {
  const { bugs, saving, deleting, savingError, deletingError, saveBug, deleteBug } = useContext(BugContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(0);
  const [bug, setBug] = useState<BugProps>();

  useEffect(() => {
    log('useEffect');

    const routeId = match.params.id || '';
    const bug = bugs?.find(bug => bug.id?.toString() === routeId);

    setBug(bug);

    if (bug) {
      setTitle(bug.title);
      setDescription(bug.description);
      setSeverity(bug.severity);
    }

  }, [match.params.id, bugs]);

  const handleSave = () => {
    const editedBug = bug ? { ...bug, title, description, severity } : { title, description, severity };
    saveBug && saveBug(editedBug).then(() => history.goBack());
  };

  const handleDelete = () => {
    const deletedBug = bug ? { ...bug, title, description, severity } : { title, description, severity };
    console.log(deleteBug)
    deleteBug && deleteBug(deletedBug).then(() => history.goBack());
  };

  const displayDeleteButton = bug ? <IonButtons slot="end"><IonButton onClick={handleDelete}>Delete</IonButton></IonButtons> : '';

  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              Save
            </IonButton>
            
          </IonButtons>
          {displayDeleteButton}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')} />
        <IonInput value={description} onIonChange={e => setDescription(e.detail.value || '')} />
        <IonInput type="number" value={severity} onIonChange={e => setSeverity(parseInt(e.detail.value!, 0))} />
        <IonLoading isOpen={saving || deleting} />
        {savingError && (
          <div>{savingError.message || 'Failed to save bug'}</div>
        )}
        {deletingError && (
          <div>{deletingError.message || 'Failed to delete bug'}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default BugEdit;
