import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { InteractiveMapNavButtons } from './InteractiveMapNavButtons';
import { MapViewSwitcher, MapViewMode } from './MapViewSwitcher';

interface MapControlsProps {
  map: mapboxgl.Map | null;
  showViewSwitcher?: boolean;
  currentMapView: MapViewMode;
  onMapViewChange: (view: MapViewMode) => void;
}

export function MapControls({ map, showViewSwitcher, currentMapView, onMapViewChange }: MapControlsProps) {
  return (
    <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
      <InteractiveMapNavButtons map={map} />
      {showViewSwitcher && (
        <MapViewSwitcher 
          currentView={currentMapView}
          onViewChange={onMapViewChange}
          location="controls"
        />
      )}
    </div>
  );
}