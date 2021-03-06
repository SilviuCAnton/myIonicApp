export interface BugProps {
    id?: number;
    title: string;
    description: string;
    severity: number;
    dateReported: Date;
    solved: boolean;
    version: number;
    photo: string;
    lat: number;
    lng: number;
  }