import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import {BugProps} from './BugProps';

interface BugPropsUpdatable extends BugProps {
  onEdit: (id?: number) => void;
}

const Bug: React.FC<BugPropsUpdatable> = ({ id, title, description, severity, dateReported, solved, onEdit }) => {
  let date = "";
  if(typeof dateReported !== 'undefined') {
    date = dateReported.toString();
  }
  return (
    <IonItem onClick={() => onEdit(id)}>
      <IonLabel>Bug {id} {title} : {description} ({severity} points) {date} {solved}</IonLabel>
    </IonItem>
  );
};

export default Bug;