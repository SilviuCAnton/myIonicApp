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
  IonImg,
  IonModal,
  createAnimation
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
  const  [showModal, setShowModal] = useState(false);
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

  const enterAnimation = (baseEl: any) => {
    const backdropAnimation = createAnimation()
      .addElement(baseEl.querySelector('ion-backdrop')!)
      .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

    const wrapperAnimation = createAnimation()
      .addElement(baseEl.querySelector('.modal-wrapper')!)
      .keyframes([
        { offset: 0, opacity: '0', transform: 'scale(0)' },
        { offset: 1, opacity: '0.99', transform: 'scale(1)' }
      ]);

    return createAnimation()
      .addElement(baseEl)
      .easing('ease-out')
      .duration(500)
      .addAnimation([backdropAnimation, wrapperAnimation]);
  }

  const leaveAnimation = (baseEl: any) => {
    return enterAnimation(baseEl).direction('reverse');
  }

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

  async function createChainedAnimation() {
    let animation1 = createAnimation()
    .addElement(document.getElementById("title")!)
    .duration(1000)
    .iterations(1)
    .keyframes([
      { offset: 0, transform: 'scale(1))', opacity: '1' },
      { offset: 0.5, transform: 'scale(0.8)', opacity: '0.3' },
      { offset: 1, transform: 'scale(1)', opacity: '1' }
    ]);

    let animation2 = createAnimation()
    .addElement(document.getElementById("descrition")!)
    .duration(1000)
    .iterations(1)
    .keyframes([
      { offset: 0, transform: 'scale(1))', opacity: '1' },
      { offset: 0.5, transform: 'scale(0.6)', opacity: '0.3' },
      { offset: 1, transform: 'scale(1)', opacity: '1' }
    ]);

    let animation3 = createAnimation()
    .addElement(document.getElementById("severity")!)
    .duration(1000)
    .iterations(1)
    .keyframes([
      { offset: 0, transform: 'scale(1))', opacity: '1' },
      { offset: 0.5, transform: 'scale(0.4)', opacity: '0.3' },
      { offset: 1, transform: 'scale(1)', opacity: '1' }
    ]);

    await animation1.play()
    await animation2.play()
    await animation3.play()
  }

  function createGroupAnimation() {
    let animation1 = createAnimation()
    .addElement(document.getElementById("title")!)
    .duration(1000)
    .iterations(1)
    .keyframes([
      { offset: 0, transform: 'scale(1))', opacity: '1' },
      { offset: 0.5, transform: 'scale(0.8)', opacity: '0.3' },
      { offset: 1, transform: 'scale(1)', opacity: '1' }
    ]);

    let animation2 = createAnimation()
    .addElement(document.getElementById("descrition")!)
    .duration(1000)
    .iterations(1)
    .keyframes([
      { offset: 0, transform: 'scale(1))', opacity: '1' },
      { offset: 0.5, transform: 'scale(0.6)', opacity: '0.3' },
      { offset: 1, transform: 'scale(1)', opacity: '1' }
    ]);

    let animation3 = createAnimation()
    .addElement(document.getElementById("severity")!)
    .duration(1000)
    .iterations(1)
    .keyframes([
      { offset: 0, transform: 'scale(1))', opacity: '1' },
      { offset: 0.5, transform: 'scale(0.4)', opacity: '0.3' },
      { offset: 1, transform: 'scale(1)', opacity: '1' }
    ]);

    const parent = createAnimation()
    .duration(1000)
    .iterations(Infinity)
    .addAnimation([animation1, animation2, animation3]);
    parent.play()
  }

  function createEditAnimation() {
    let animation = createAnimation()
    .addElement(document.getElementById("check")!)
    .duration(3000)
    .iterations(1)
    .keyframes([
      { offset: 0.2, transform: 'scale(1) rotate(0)' },
      { offset: 0.4, transform: 'scale(1.2) rotate(45deg)' },
      { offset: 0.6, transform: 'scale(1) rotate(45deg)' },
      { offset: 0.8, transform: 'scale(1) rotate(-45deg)' },
      { offset: 1, transform: 'scale(1) rotate(0)' }
    ]);
    animation.play()
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
        <IonInput value={title} id='title' onIonChange={e => {setTitle(e.detail.value || ''); createGroupAnimation()}} />
        <IonHeader>Description</IonHeader>
        <IonInput value={description} id='descrition' onIonChange={e => {setDescription(e.detail.value || ''); createGroupAnimation()}} />
        <IonHeader>Severity</IonHeader>
        <IonInput type="number" value={severity} id='severity' onIonChange={e => {setSeverity(parseInt(e.detail.value!, 0)); createGroupAnimation()}} />
        <IonHeader>Date Reported</IonHeader>
        <IonDatetime
            displayFormat="MM DD YY"
            value={dateReported.toString()} onIonChange={async e => {setDateReported(new Date(e.detail.value!)); await createChainedAnimation()}}>
        </IonDatetime>
        <IonHeader>Solved</IonHeader>
        <IonCheckbox checked={solved} id='check' onIonChange={e => {setSolved(e.detail.checked); createEditAnimation()}} />
        {photo && (<img onClick={handlePhotoChange} src={photo} width={'100px'} height={'100px'}/>)}
        {!photo && (<img onClick={handlePhotoChange} src={'https://verimedhealthgroup.com/wp-content/uploads/2019/03/profile-img.jpg'} width={'100px'} height={'100px'}/>)}
        {console.log(lat2)}
        <IonModal isOpen={showModal} enterAnimation={enterAnimation} leaveAnimation={leaveAnimation}>
          <Map
              lat={lat2}
              lng={lng2}
              onMapClick={handleMapOnClick()}
          />
          <IonButton onClick={() => setShowModal(false)}>Close Map</IonButton>
        </IonModal>
        <IonButton onClick={() => setShowModal(true)}>Select Location</IonButton>
        
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
