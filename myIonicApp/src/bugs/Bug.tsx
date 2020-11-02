import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import {BugProps} from './BugProps';

interface BugPropsUpdatable extends BugProps {
  onEdit: (id?: number) => void;
}

const Bug: React.FC<BugPropsUpdatable> = ({ id, title, description, severity, onEdit }) => {
  return (
    <IonItem onClick={() => onEdit(id)}>
      <IonLabel>Bug {title} : {description} ({severity} points)</IonLabel>
    </IonItem>
  );
};

export default Bug;