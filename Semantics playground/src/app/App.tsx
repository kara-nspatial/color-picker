import { useState, useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapControls } from './components/MapControls';
import { InteractiveToolbar, SelectMode, MeasureMode } from './components/InteractiveToolbar';
import SiteNamePanel from './components/SiteNamePanel';
import PrototypeMenu from './components/PrototypeMenu';
import { MapViewMode } from './components/MapViewSwitcher';
import { createBuilding3DLayer, loadGLTFFromURL, hideObjectByName } from './components/Building3DLayer';
import SelectionInfoPanel from './components/SelectionInfoPanel';
import BoundaryResultsPanel, { type BoundaryItem } from './components/BoundaryResultsPanel';
import MeasurementsPanel, { type Measurement, type Units, formatDistance } from './components/MeasurementsPanel';
import VisualSearchPanel from './components/VisualSearchPanel';
import { ThreeTest } from './components/ThreeTest';
import 'mapbox-gl/dist/mapbox-gl.css';

// ── The GLB file lives at /public/model.glb and is served at /model.glb ──────
const MODEL_URL = '/model.glb';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
mapboxgl.accessToken = MAPBOX_TOKEN;

type ViewSwitcherLocation = 'controls' | 'toolbar';

interface SelectionInfo {
  name: string;
  type: string;
  dimensions?: string;
  material?: string;
  color?: string;
  location?: string;
}

type ModelStatus = 'idle' | 'loading' | 'ready' | 'error' | 'missing';

export default function App() {
  const [mapInstance, setMapInstance]                 = useState<mapboxgl.Map | null>(null);
  const [viewSwitcherLocation, setViewSwitcherLocation] = useState<ViewSwitcherLocation>('controls');
  const [mapViewMode, setMapViewMode]                 = useState<MapViewMode>('streets');
  const [showSiteName, setShowSiteName]               = useState(true);
  const [showGeoreference, setShowGeoreference]       = useState(true);
  const [showAnnotation, setShowAnnotation]           = useState(true);
  const [showDownload, setShowDownload]               = useState(true);
  const [showSemantics, setShowSemantics]             = useState(false);
  const [showMeasure, setShowMeasure]                 = useState(true);
  const [showSearch, setShowSearch]                   = useState(true);
  const [showSelect, setShowSelect]                   = useState(true);
  const [selectMode, setSelectMode]                   = useState<SelectMode>('element');
  const [selectToolActive, setSelectToolActive]       = useState(false);
  const [measureToolActive, setMeasureToolActive]     = useState(false);
  const [activeMeasureMode, setActiveMeasureMode]     = useState<MeasureMode>('distance');
  const [selectedObject, setSelectedObject]           = useState<SelectionInfo | null>(null);
  const [selectedObjectKind, setSelectedObjectKind]   = useState<'chair' | 'desk' | 'monitor' | null>(null);
  const [modelStatus, setModelStatus]                 = useState<ModelStatus>('ready');
  const [loadProgress, setLoadProgress]               = useState(0);
  const [measurements, setMeasurements]               = useState<Measurement[]>([]);
  const [measurePanelVisible, setMeasurePanelVisible] = useState(false);
  const [measureUnits, setMeasureUnits]               = useState<Units>('metric');
  const [foundChairCount, setFoundChairCount]         = useState<number | null>(null);
  const [measureAlwaysVisible, setMeasureAlwaysVisible] = useState(false);
  const [georefToolActive, setGeorefToolActive] = useState(false);
  const [searchMode, setSearchMode] = useState<'toolbar' | 'floating'>('toolbar');

  // ── Boundary draw-select state ──────────────────────────────────────────────
  type BoundaryDrag = { startX: number; startY: number; currentX: number; currentY: number; isDrawing: boolean };
  const [boundaryDrag, setBoundaryDrag]             = useState<BoundaryDrag | null>(null);
  const [boundarySelection, setBoundarySelection]   = useState<BoundaryItem[] | null>(null);

  const mapContainer        = useRef<HTMLDivElement>(null);
  const map                 = useRef<mapboxgl.Map | null>(null);
  const selectModeRef       = useRef<SelectMode>('element');
  const selectToolActiveRef = useRef<boolean>(false);
  const building3DLayerRef  = useRef<any>(null);
  const measureLabelRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());
  // Stores all base-style layer IDs so we can toggle them without setStyle()
  const streetLayerIdsRef   = useRef<string[]>([]);

  const buildingLayerId = '3d-model';

  // Keep refs in sync with state
  useEffect(() => { selectModeRef.current = selectMode; }, [selectMode]);
  useEffect(() => { selectToolActiveRef.current = selectToolActive; }, [selectToolActive]);

  useEffect(() => {
    if (building3DLayerRef.current?.setSelectMode) {
      const mode = selectToolActive && selectMode === 'element' ? 'click' : 'none';
      building3DLayerRef.current.setSelectMode(mode);
    }
  }, [selectToolActive, selectMode]);

  // ── Bidirectional sync: deactivate tool → close panel ────────────────────
  useEffect(() => {
    if (!selectToolActive) {
      setSelectedObject(null);
      setFoundChairCount(null);
      setBoundaryDrag(null);
      setBoundarySelection(null);
      building3DLayerRef.current?.clearAllHighlights?.();
      building3DLayerRef.current?.deselectChair?.();
    }
  }, [selectToolActive]);

  // ── Boundary drag-select: raw DOM listeners to capture before Mapbox ──────
  useEffect(() => {
    if (!selectToolActive || selectMode !== 'boundary') {
      setBoundaryDrag(null);
      return;
    }
    const el = mapContainer.current;
    if (!el) return;

    const startPos = { x: 0, y: 0 };
    let isDrawing = false;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      startPos.x = e.clientX - rect.left;
      startPos.y = e.clientY - rect.top;
      isDrawing = true;
      setBoundaryDrag({ startX: startPos.x, startY: startPos.y, currentX: startPos.x, currentY: startPos.y, isDrawing: true });
      setBoundarySelection(null);
      building3DLayerRef.current?.clearAllHighlights?.();
      e.preventDefault();
      e.stopPropagation();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setBoundaryDrag({ startX: startPos.x, startY: startPos.y, currentX: cx, currentY: cy, isDrawing: true });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDrawing) return;
      isDrawing = false;
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setBoundaryDrag({ startX: startPos.x, startY: startPos.y, currentX: cx, currentY: cy, isDrawing: false });

      const groups: BoundaryItem[] | undefined = building3DLayerRef.current?.getGroupsInScreenRect?.(
        startPos.x, startPos.y, cx, cy
      );
      if (groups && groups.length > 0) {
        building3DLayerRef.current?.highlightBoundarySelection?.(groups.map((g: BoundaryItem) => g.id));
        setBoundarySelection(groups);
      } else {
        setBoundarySelection([]);
      }
    };

    el.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.style.cursor = 'crosshair';

    return () => {
      el.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.style.cursor = '';
      setBoundaryDrag(null);
    };
  }, [selectToolActive, selectMode]);

  useEffect(() => {
    if (!measureToolActive) {
      setMeasurePanelVisible(false);
      building3DLayerRef.current?.setMeasureActive?.(false);
    }
  }, [measureToolActive]);

  // ── Sync 3D line visibility with tool state + alwaysVisible toggle ───────
  useEffect(() => {
    building3DLayerRef.current?.setMeasureLinesVisible?.(measureToolActive || measureAlwaysVisible);
  }, [measureToolActive, measureAlwaysVisible]);

  // ── Auto-load model from /public/model.glb ───────────────────────────────
  const autoLoadModel = (layerRef: any, mapRef: mapboxgl.Map) => {
    // First check if the file exists by doing a HEAD request
    fetch(MODEL_URL, { method: 'HEAD' })
      .then((res) => {
        const ct = res.headers.get('content-type') ?? '';
        if (!res.ok || ct.includes('text/html')) {
          // No GLB found — procedural office is already showing, nothing to do
          console.info('ℹ️  No GLB at /model.glb — procedural scene is active');
          return;
        }

        setModelStatus('loading');
        setLoadProgress(0);

        loadGLTFFromURL(
          layerRef.layer,
          MODEL_URL,
          (pct) => setLoadProgress(pct),
          () => {
            console.log('✅ model.glb loaded');
            setModelStatus('ready');
            mapRef.triggerRepaint();
          },
          () => {
            setModelStatus('error');
          },
        );
      })
      .catch(() => {
        // Network error — stay with procedural scene
        console.info('ℹ️  Could not reach /model.glb — procedural scene is active');
      });
  };

  // ── Map initialisation ────────────────────────────────────────────────────
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.4132, 37.8082],
        zoom: 18,
        pitch: 45,
        bearing: 0,
      });

      map.current.on('load', () => {
        console.log('🗺️  Map loaded');

        // ── Save all base style layer IDs BEFORE we add anything custom ──────
        const baseStyleLayers = map.current!.getStyle().layers ?? [];
        streetLayerIdsRef.current = baseStyleLayers.map(l => l.id);

        // Remove POI / label layers for a cleaner view
        baseStyleLayers.forEach((layer) => {
          if (layer.id.includes('poi') || layer.id.includes('label')) {
            map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });

        // ── Pre-load satellite raster source + layer (hidden by default) ─────
        // Insert it BELOW all street layers so streets overlay correctly on top.
        map.current!.addSource('mapbox-satellite', {
          type: 'raster',
          url: 'mapbox://mapbox.satellite',
          tileSize: 256,
        });
        map.current!.addLayer(
          {
            id: 'satellite-raster',
            type: 'raster',
            source: 'mapbox-satellite',
            layout: { visibility: 'none' },
          },
          baseStyleLayers[0]?.id, // insert before the very first street layer
        );

        // Add the THREE.js custom layer
        const {
          layer, handleMouseMove, setSelectMode, handleClick, deselectChair,
          setChairSelectedCallback, setMeasureActive, deleteMeasurement,
          getMidpointLngLat, setMeasurementCallbacks, setLabelPositionCallback,
          highlightAllOfKind, clearAllHighlights,
          getGroupsInScreenRect, highlightBoundarySelection,
          setMeasureLinesVisible,
          setGeorefActive, setModelOpacity, saveGeoref, cancelGeoref,
          startGeorefDrag, updateGeorefDrag, endGeorefDrag,
        } = createBuilding3DLayer();
        building3DLayerRef.current = {
          layer, handleMouseMove, setSelectMode, handleClick, deselectChair,
          setMeasureActive, deleteMeasurement, getMidpointLngLat,
          highlightAllOfKind, clearAllHighlights,
          getGroupsInScreenRect, highlightBoundarySelection,
          setMeasureLinesVisible,
          setGeorefActive, setModelOpacity, saveGeoref, cancelGeoref,
          startGeorefDrag, updateGeorefDrag, endGeorefDrag,
        };

        // Wire up chair-selection callback
        setChairSelectedCallback((name, kind) => {
          if (name) {
            if (kind === 'desk') {
              setSelectedObject({
                name: 'Jarvis Bamboo Standing Desk',
                type: 'Height-Adjustable Desk, Bamboo Top, Steel Frame',
              });
            } else if (kind === 'monitor') {
              setSelectedObject({
                name: 'Dell UltraSharp 27" 4K Monitor',
                type: 'U2723QE, USB-C Hub, IPS Black Panel',
              });
            } else {
              setSelectedObject({
                name: 'Herman Miller Aeron',
                type: 'V2 Remastered Chair, Adjustable Arms, Adjustable Lumbar Support',
              });
            }
            setSelectedObjectKind((kind ?? 'chair') as 'chair' | 'desk' | 'monitor');
          } else {
            setSelectedObject(null);
            setSelectedObjectKind(null);
          }
        });

        // Wire up measurement callbacks
        setMeasurementCallbacks(
          (id, distanceM) => {
            setMeasurements(prev => [...prev, {
              id,
              distanceM,
              type: 'distance',
              name: `Measurement ${prev.length + 1}`,
            }]);
            setMeasurePanelVisible(true);
          },
          (id) => {
            setMeasurements(prev => prev.filter(m => m.id !== id));
          },
        );

        // Wire label-position callback (direct DOM updates, no React state)
        setLabelPositionCallback((data) => {
          for (const { id, x, y } of data) {
            const el = measureLabelRefsMap.current.get(id);
            if (el) {
              el.style.left = `${x}px`;
              el.style.top  = `${y - 8}px`;
            }
          }
        });

        map.current?.addLayer(layer);

        // DevTools helpers
        (window as any).__3dLayer    = building3DLayerRef;
        (window as any).__hideObject = (name: string) =>
          hideObjectByName(building3DLayerRef.current?.layer, name);
        console.log('💡 DevTools: __hideObject("MeshName") to hide any object by name');

        setMapInstance(map.current);

        // ── Auto-load the permanent model ─────────────────────────────────
        if (map.current) autoLoadModel(building3DLayerRef.current, map.current);
      });

      map.current.on('mousemove', (e) => {
        if (!map.current || !building3DLayerRef.current?.handleMouseMove) return;
        building3DLayerRef.current.handleMouseMove(map.current, e.originalEvent);
      });

      map.current.on('click', (e) => {
        if (!map.current || !building3DLayerRef.current?.handleClick) return;
        building3DLayerRef.current.handleClick(map.current, e.originalEvent);
      });

      map.current.on('error', (e) => console.error('Map error:', e));
    } catch (err) {
      console.error('Error initialising map:', err);
    }

    return () => { map.current?.remove(); };
  }, []);

  // ── Georeference drag listeners (capture before Mapbox pan) ──────────────
  useEffect(() => {
    if (!georefToolActive) return;
    const el = mapContainer.current;
    if (!el) return;

    let dragging = false;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // Layer determines whether handle or bbox was hit; returns false if neither
      const started = building3DLayerRef.current?.startGeorefDrag?.(e.clientX, e.clientY);
      if (started) {
        dragging = true;
        e.preventDefault();
        e.stopPropagation();
        el.style.cursor = 'grabbing';
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      building3DLayerRef.current?.updateGeorefDrag?.(e.clientX, e.clientY);
    };
    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      building3DLayerRef.current?.endGeorefDrag?.();
      el.style.cursor = '';
    };

    el.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.style.cursor = '';
    };
  }, [georefToolActive]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGeoreferenceClick = () => {
    const next = !georefToolActive;
    setGeorefToolActive(next);
    building3DLayerRef.current?.setGeorefActive?.(next);
  };
  const handleGeorefSave = () => {
    setGeorefToolActive(false);
    building3DLayerRef.current?.saveGeoref?.();
  };
  const handleGeorefCancel = () => {
    setGeorefToolActive(false);
    building3DLayerRef.current?.cancelGeoref?.();
  };
  const handleGeorefOpacityChange = (opacity: number) => {
    building3DLayerRef.current?.setModelOpacity?.(opacity);
  };

  const handleAnnotationClick   = () => console.log('Annotation tool clicked');
  const handleDownloadClick     = () => console.log('Download assets clicked');
  const handleSemanticsClick    = () => console.log('Semantics tool clicked');
  const handleViewModeChange    = (mode: 'mesh' | 'splat') => console.log('View mode:', mode);

  const handleMapViewChange = (view: MapViewMode) => {
    if (!map.current) return;
    setMapViewMode(view);

    const streetIds    = streetLayerIdsRef.current;
    const satelliteId  = 'satellite-raster';

    if (view === 'streets') {
      // Restore all base street layers to their original visibility
      streetIds.forEach(id => {
        // Keep POI/labels hidden (they were hidden on load)
        if (id.includes('poi') || id.includes('label')) return;
        try { map.current?.setLayoutProperty(id, 'visibility', 'visible'); } catch {}
      });
      // Hide satellite
      try { map.current?.setLayoutProperty(satelliteId, 'visibility', 'none'); } catch {}

    } else if (view === 'satellite') {
      // Hide all base street layers
      streetIds.forEach(id => {
        try { map.current?.setLayoutProperty(id, 'visibility', 'none'); } catch {}
      });
      // Show satellite raster
      try { map.current?.setLayoutProperty(satelliteId, 'visibility', 'visible'); } catch {}

    } else if (view === 'hidden') {
      // Hide everything — street layers AND satellite
      streetIds.forEach(id => {
        try { map.current?.setLayoutProperty(id, 'visibility', 'none'); } catch {}
      });
      try { map.current?.setLayoutProperty(satelliteId, 'visibility', 'none'); } catch {}
    }
  };

  const handleSelectModeChange = (mode: SelectMode, isOpen: boolean) => {
    setSelectMode(mode);
    setSelectToolActive(isOpen);
    if (isOpen) {
      // Deactivate measure tool when select becomes active
      setMeasureToolActive(false);
      building3DLayerRef.current?.setMeasureActive?.(false);
    }
  };

  const handleMeasureModeChange = (mode: MeasureMode | null, isActive: boolean) => {
    setMeasureToolActive(isActive);
    if (isActive && mode) {
      // Deactivate select tool when measure becomes active
      setSelectToolActive(false);
      building3DLayerRef.current?.setSelectMode?.('none');
      setActiveMeasureMode(mode);
      building3DLayerRef.current?.setMeasureActive?.(mode === 'distance');
      // Re-show panel if there are existing measurements
      setMeasurements(prev => {
        if (prev.length > 0) setMeasurePanelVisible(true);
        return prev;
      });
    } else {
      building3DLayerRef.current?.setMeasureActive?.(false);
    }
  };

  const handleRenameMeasurement = (id: number, newName: string) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
  };

  const handleViewMeasurement = (id: number) => {
    const lngLat = building3DLayerRef.current?.getMidpointLngLat?.(id);
    if (lngLat && map.current) {
      map.current.flyTo({ center: lngLat, zoom: 20, pitch: 55, duration: 1200 });
    }
  };

  return (
    <div
      className="size-full relative"
      style={{ backgroundColor: mapViewMode === 'hidden' ? '#E5E7EB' : 'transparent' }}
    >
      {/* Full-screen map canvas */}
      <div ref={mapContainer} className="size-full" />

      {/* ── Boundary selection rectangle (pointer-events-none, purely visual) ── */}
      {selectMode === 'boundary' && selectToolActive && boundaryDrag && (
        <div
          className="absolute pointer-events-none z-[15]"
          style={{
            left:   Math.min(boundaryDrag.startX, boundaryDrag.currentX),
            top:    Math.min(boundaryDrag.startY, boundaryDrag.currentY),
            width:  Math.abs(boundaryDrag.currentX - boundaryDrag.startX),
            height: Math.abs(boundaryDrag.currentY - boundaryDrag.startY),
            border: '1.5px dashed #1a6fff',
            background: 'rgba(26,111,255,0.07)',
            borderRadius: '4px',
            boxShadow: 'inset 0 0 0 1px rgba(26,111,255,0.15)',
          }}
        />
      )}

      {/* ── Model loading overlay ──────────────────────────────────────── */}
      {(modelStatus === 'loading' || modelStatus === 'missing' || modelStatus === 'error') && (
        <div className="absolute top-6 right-6 z-20 backdrop-blur-[4px] bg-[rgba(255,255,255,0.92)] px-5 py-3 rounded-[14px] border border-[#d5dcec] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.18)] flex items-center gap-3 min-w-[220px]">
          {modelStatus === 'loading' && (
            <>
              {/* Spinner */}
              <svg className="animate-spin shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#d5dcec" strokeWidth="2.5" />
                <path d="M9 2a7 7 0 0 1 7 7" stroke="#2D5290" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-xs text-[#0C1220]" style={{ fontFamily: 'Figtree, sans-serif' }}>
                  Loading 3D model…
                </span>
                {/* Progress bar */}
                <div className="h-1 w-full rounded-full bg-[#e8edf6] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2D5290] transition-all duration-200"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#8896b0]" style={{ fontFamily: 'Figtree, sans-serif' }}>
                  {loadProgress}%
                </span>
              </div>
            </>
          )}

          {modelStatus === 'missing' && (
            <>
              <span className="text-base shrink-0">📂</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#0C1220]" style={{ fontFamily: 'Figtree, sans-serif' }}>
                  No model found
                </span>
                <span className="text-[10px] text-[#8896b0] leading-tight" style={{ fontFamily: 'Figtree, sans-serif' }}>
                  Upload <strong>model.glb</strong> to <code className="bg-[#f0f3fa] px-1 rounded text-[9px]">/public</code>
                </span>
              </div>
            </>
          )}

          {modelStatus === 'error' && (
            <>
              <span className="text-base shrink-0">⚠️</span>
              <span className="text-xs text-[#b03030]" style={{ fontFamily: 'Figtree, sans-serif' }}>
                Failed to load model
              </span>
            </>
          )}
        </div>
      )}

      {/* Map Controls – lower left */}
      <MapControls
        map={mapInstance}
        showViewSwitcher={viewSwitcherLocation === 'controls'}
        currentMapView={mapViewMode}
        onMapViewChange={handleMapViewChange}
      />

      {/* Toolbar – bottom centre */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        {selectToolActive && selectMode === 'boundary' && (
          <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 backdrop-blur-[4px] bg-[rgba(235,243,255,0.96)] px-6 py-3.5 rounded-[16px] border border-[#95afe0] shadow-[0px_0px_8px_0px_rgba(26,111,255,0.18)] pointer-events-none whitespace-nowrap">
            <p className="text-sm text-[#1a3d73] font-medium text-center" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Click and drag on the scene to select objects in a region
            </p>
          </div>
        )}
        <InteractiveToolbar
          onViewModeChange={handleViewModeChange}
          onGeoreferenceClick={handleGeoreferenceClick}
          onAnnotationClick={handleAnnotationClick}
          onDownloadClick={handleDownloadClick}
          onSemanticsClick={handleSemanticsClick}
          showViewSwitcher={viewSwitcherLocation === 'toolbar'}
          currentMapView={mapViewMode}
          onMapViewChange={handleMapViewChange}
          showGeoreference={showGeoreference}
          showAnnotation={showAnnotation}
          showDownload={showDownload}
          showSemantics={showSemantics}
          showMeasure={showMeasure}
          showSearch={showSearch}
          showSelect={showSelect}
          onSelectModeChange={handleSelectModeChange}
          onMeasureModeChange={handleMeasureModeChange}
          controlledSelectActive={selectToolActive}
          controlledMeasureActive={measureToolActive}
          controlledGeorefActive={georefToolActive}
          onGeorefSave={handleGeorefSave}
          onGeorefCancel={handleGeorefCancel}
          onGeorefOpacityChange={handleGeorefOpacityChange}
          onSearchHighlight={() => {
            const count = building3DLayerRef.current?.highlightAllOfKind?.('chair');
            if (count != null) setFoundChairCount(count);
          }}
          searchMode={searchMode}
        />
      </div>

      {/* Site Name Panel – upper left */}
      {showSiteName && (
        <div className="absolute top-6 left-6 z-10">
          <SiteNamePanel />
        </div>
      )}

      {/* Prototype Menu */}
      <PrototypeMenu
        viewSwitcherLocation={viewSwitcherLocation}
        onViewSwitcherLocationChange={setViewSwitcherLocation}
        showSiteName={showSiteName}
        onShowSiteNameChange={setShowSiteName}
        showGeoreference={showGeoreference}
        onShowGeoreferenceChange={setShowGeoreference}
        showAnnotation={showAnnotation}
        onShowAnnotationChange={setShowAnnotation}
        showDownload={showDownload}
        onShowDownloadChange={setShowDownload}
        showSemantics={showSemantics}
        onShowSemanticsChange={setShowSemantics}
        showMeasure={showMeasure}
        onShowMeasureChange={setShowMeasure}
        showSearch={showSearch}
        onShowSearchChange={setShowSearch}
        showSelect={showSelect}
        onShowSelectChange={setShowSelect}
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
      />

      {/* ── Right-side panel stack ─────────────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-3 items-end">
        {/* Boundary results panel */}
        {selectMode === 'boundary' && selectToolActive && boundarySelection !== null && (
          <BoundaryResultsPanel
            items={boundarySelection}
            onClose={() => {
              setBoundarySelection(null);
              building3DLayerRef.current?.clearAllHighlights?.();
            }}
          />
        )}
        {(measurePanelVisible) && (
          <MeasurementsPanel
            measurements={measurements}
            units={measureUnits}
            onUnitsChange={setMeasureUnits}
            alwaysVisible={measureAlwaysVisible}
            onAlwaysVisibleChange={(v) => {
              setMeasureAlwaysVisible(v);
              // If toggling off while tool is inactive, hide the panel
              if (!v) setMeasurePanelVisible(false);
            }}
            onClose={() => {
              setMeasurePanelVisible(false);
              setMeasureAlwaysVisible(false);
              setMeasureToolActive(false);
            }}
            onDelete={(id) => building3DLayerRef.current?.deleteMeasurement?.(id)}
            onView={handleViewMeasurement}
            onRename={handleRenameMeasurement}
          />
        )}
        {selectToolActive && selectMode === 'visual-search' && (
          <VisualSearchPanel
            onClose={() => setSelectToolActive(false)}
            onHighlight={() => console.log('Highlight in model')}
          />
        )}
        <SelectionInfoPanel
          selection={selectedObject}
          foundCount={foundChairCount}
          onFindAllInScene={() => {
            const count = building3DLayerRef.current?.highlightAllOfKind?.(selectedObjectKind);
            if (count != null) setFoundChairCount(count);
          }}
          onClearFound={() => {
            setFoundChairCount(null);
            building3DLayerRef.current?.clearAllHighlights?.();
            // Re-select the previously selected chair
            building3DLayerRef.current?.deselectChair?.();
          }}
          onClose={() => {
            setSelectedObject(null);
            setFoundChairCount(null);
            setSelectToolActive(false);
            building3DLayerRef.current?.clearAllHighlights?.();
            building3DLayerRef.current?.deselectChair?.();
          }}
        />
      </div>

      {/* ── Measurement distance labels (direct-DOM positioned per frame) ────── */}
      {(measureToolActive || measureAlwaysVisible) && measurements.map(m => (
        <div
          key={m.id}
          ref={el => {
            if (el) measureLabelRefsMap.current.set(m.id, el);
            else measureLabelRefsMap.current.delete(m.id);
          }}
          className="absolute z-10 pointer-events-none"
          style={{ left: 0, top: 0, transform: 'translateX(-50%) translateY(-100%)' }}
        >
          <div
            className="px-2.5 py-0.5 rounded-full text-white whitespace-nowrap shadow-md"
            style={{
              background: '#f97316',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'Figtree, sans-serif',
              letterSpacing: '0.01em',
            }}
          >
            {formatDistance(m.distanceM, measureUnits)}
          </div>
        </div>
      ))}

      {/* THREE.js Test */}
      <ThreeTest />
    </div>
  );
}