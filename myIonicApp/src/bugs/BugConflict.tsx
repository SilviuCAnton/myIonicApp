import React from 'react';
import { IonHeader, IonItem, IonLabel } from '@ionic/react';
import {BugProps} from './BugProps';
import { BugDiff } from './BugDiff';
import Bug from './Bug';

interface BugDiffSolvable extends BugDiff {
  onSolve: (version: BugProps) => void;
}

const BugConflict: React.FC<BugDiffSolvable> = ({ localVersion, serverVersion, onSolve }) => {
  return (
    <>
    <IonLabel>Local:</IonLabel>
    <br></br>
    <IonItem onClick={() => onSolve(localVersion)}>
      <Bug key={-(localVersion.id!)} id={localVersion.id} title={localVersion.title} description={localVersion.description} severity={localVersion.severity} dateReported={localVersion.dateReported} solved={localVersion.solved} onEdit={id => console.log(id)} />
    </IonItem>
    <IonLabel>Server:</IonLabel>
    <br></br>
    <IonItem onClick={() => onSolve(serverVersion)}>
      <Bug key={serverVersion.id} id={serverVersion.id} title={serverVersion.title} description={serverVersion.description} severity={serverVersion.severity} dateReported={serverVersion.dateReported} solved={serverVersion.solved} onEdit={id => console.log(id)} />
    </IonItem>
    <br></br>
    </>
  );
};

export default BugConflict;