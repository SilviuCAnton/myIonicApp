import { useState } from 'react';

interface Location {
  lat: number,
  lng: number,
  error?: Error;
}

export const useLocation = () => {
  const [state, setState] = useState<Location>({lat: 0, lng: 0});

  function updateLocation(source: string, lat: number, lng: number, error: any = undefined) {
    setState({ ...state, lat: lat || state.lat, lng: lng || state.lng, error });
  }

  return {location: state, updateLocation};
};