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
  IonToolbar,
  IonImg
} from '@ionic/react';
import { getLogger } from '../core';
import {Map} from "../maps/Map";
import { BugContext } from './BugProvider';
import { RouteComponentProps } from 'react-router';
import { BugProps } from './BugProps';
import { usePhotoGallery } from '../photos/usePhotoGallery';
import { useLocation } from '../maps/useLocation';

const log = getLogger('BugEdit');

interface BugEditProps extends RouteComponentProps<{
  id?: string;
}> {}

const BugEdit: React.FC<BugEditProps> = ({ history, match }) => {
  const {location, updateLocation} = useLocation();
  const { lat: lat2, lng: lng2 } = location || {};
  const { bugs, saving, deleting, savingError, deletingError, saveBug, deleteBug } = useContext(BugContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(0);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [dateReported, setDateReported] = useState(new Date());
  const [solved, setSolved] = useState(false);
  const [version, setVersion] = useState(-1);
  const [bug, setBug] = useState<BugProps>();
  const [photo, setPhoto] = useState('');
  const {takePhoto} = usePhotoGallery();

  useEffect(() => {
    log('useEffect');

    const routeId = match.params.id || '';
    const foundBug = bugs?.find(bug => bug.id?.toString() === routeId);
    let viewBug = undefined;
    if(foundBug) {
      viewBug = {id: foundBug.id, title: foundBug.title, description: foundBug.description, severity: foundBug.severity, dateReported: foundBug.dateReported, solved: foundBug.solved, photo: foundBug.photo, version: foundBug.version, lat: foundBug.lat, lng: foundBug.lng}
    }

    setBug(viewBug)

    if (viewBug) {
      setTitle(viewBug.title);
      setDescription(viewBug.description);
      setSeverity(viewBug.severity);
      setPhoto(viewBug.photo);
      setLat(viewBug.lat);
      setLng(viewBug.lng);
      updateLocation('current', viewBug.lat, viewBug.lng);
    }

  }, [match.params.id, bugs]);

  const handleSave = () => {
    const editedBug = bug ? { ...bug, title, description, severity, dateReported, solved, photo, lat, lng } : { title, description, severity, dateReported, solved, version, photo, lat, lng };
    saveBug && saveBug(editedBug).then(() => history.goBack());
  };

  const handleDelete = () => {
    const deletedBug = bug ? { ...bug, title, description, severity, dateReported, solved, photo, lat, lng } : { title, description, severity, dateReported, solved, version, photo, lat, lng };
    deleteBug && deleteBug(deletedBug).then(() => history.goBack());
  };

  async function handlePhotoChange() {
    const image = await takePhoto();
    if (!image) {
      setPhoto('');
    } else {
      setPhoto(image);
    }
  }

  function handleMapOnClick() {
    return (e: any) => {
      updateLocation('current', e.latLng.lat(), e.latLng.lng());
      setLat(e.latLng.lat());
      setLng(e.latLng.lng());
    }
  }

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
        {photo && (<img onClick={handlePhotoChange} src={photo} width={'100px'} height={'100px'}/>)}
        {!photo && (<img onClick={handlePhotoChange} src={'https://verimedhealthgroup.com/wp-content/uploads/2019/03/profile-img.jpg'} width={'100px'} height={'100px'}/>)}
        {console.log(lat2)}
        <Map
            lat={lat2}
            lng={lng2}
            onMapClick={handleMapOnClick()}
        />
        
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
