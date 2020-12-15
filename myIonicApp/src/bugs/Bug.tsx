import React from 'react';
import { IonContent, IonLoading, IonItem, IonLabel } from '@ionic/react';
import {BugProps} from './BugProps';

interface BugPropsUpdatable extends BugProps {
  onEdit: (id?: number) => void;
}

const Bug: React.FC<BugPropsUpdatable> = ({ id, title, description, severity, dateReported, solved, version, photo, lat, lng, onEdit }) => {
  
  function onMaps(lat: number, lng: number) {
    const win = window.open(`https://www.google.ro/maps/@${lat},${lng},14z`, '_blank');
    win?.focus();
  }
  
  let date = "";

  if(typeof dateReported !== 'undefined') {
    date = dateReported.toString();
  }

  return (
    <IonItem onClick={() => onEdit(id)}>
      <IonLabel>Bug {id} {title} : {description} ({severity} points) {date} {solved}</IonLabel>
      <IonLabel onClick={() => onMaps(lat, lng)}>{lat} {lng}</IonLabel>
      {photo && (<img src={photo} width={'100px'} height={'100px'}/>)}
      {!photo && (<img src={'https://verimedhealthgroup.com/wp-content/uploads/2019/03/profile-img.jpg'} width={'100px'} height={'100px'}/>)}
    </IonItem>
  );
};

export default Bug;