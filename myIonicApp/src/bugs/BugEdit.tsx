import React, { useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonDatetime,
  IonHeader,
  IonInput,
  IonLabel,
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
  const [dateReported, setDateReported] = useState(new Date());
  const [solved, setSolved] = useState(false);
  const [version, setVersion] = useState(-1);
  const [bug, setBug] = useState<BugProps>();

  useEffect(() => {
    log('useEffect');

    const routeId = match.params.id || '';
    const foundBug = bugs?.find(bug => bug.id?.toString() === routeId);
    let viewBug = undefined;
    if(foundBug) {
      viewBug = {id: foundBug.id, title: foundBug.title, description: foundBug.description, severity: foundBug.severity, dateReported: foundBug.dateReported, solved: foundBug.solved, version: foundBug.version}
    }

    setBug(viewBug)

    if (viewBug) {
      setTitle(viewBug.title);
      setDescription(viewBug.description);
      setSeverity(viewBug.severity);
    }

  }, [match.params.id, bugs]);

  const handleSave = () => {
    const editedBug = bug ? { ...bug, title, description, severity, dateReported, solved } : { title, description, severity, dateReported, solved, version };
    saveBug && saveBug(editedBug).then(() => history.goBack());
  };

  const handleDelete = () => {
    const deletedBug = bug ? { ...bug, title, description, severity, dateReported, solved } : { title, description, severity, dateReported, solved, version };
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
        <IonHeader>Title</IonHeader>
        <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')} />
        <IonHeader>Description</IonHeader>
        <IonInput value={description} onIonChange={e => setDescription(e.detail.value || '')} />
        <IonHeader>Severity</IonHeader>
        <IonInput type="number" value={severity} onIonChange={e => setSeverity(parseInt(e.detail.value!, 0))} />
        <IonHeader>Date Reported</IonHeader>
        <IonDatetime
            displayFormat="MM DD YY"
            value={dateReported.toString()} onIonChange={e => setDateReported(new Date(e.detail.value!))}>
        </IonDatetime>
        <IonHeader>Solved</IonHeader>
        <IonCheckbox checked={solved} onIonChange={e => setSolved(e.detail.checked)} />
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
