import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from "../../imports/ToolBar20/svg-u0k3vcaky9";
import downloadSvgPaths from "../../imports/Frame1/svg-cuxsq2n3of";
import rulerSvgPaths from "../../imports/SizeRuler/svg-ou8zc8dq2j";
import searchSvgPaths from "../../imports/Component/svg-4pzlloiclw";
import semanticsSvgPaths from "../../imports/NsLogos/svg-0y13wkstxb";
import { MapViewSwitcher, MapViewMode } from './MapViewSwitcher';
import { MousePointer, ChevronDown, Ruler, Box, Layers, Camera, X, SquareDashed } from 'lucide-react';
import { SearchChatPanel } from './SearchChatPanel';

type ViewMode = 'mesh' | 'splat';
type DownloadOption = 'mesh' | 'compressed' | 'uncompressed';
export type SelectMode = 'element' | 'boundary' | 'visual-search';
export type MeasureMode = 'distance' | 'volume' | 'surface-area';

interface InteractiveToolbarProps {
  onViewModeChange: (mode: 'mesh' | 'splat') => void;
  onGeoreferenceClick: () => void;
  onAnnotationClick: () => void;
  onDownloadClick: () => void;
  onSemanticsClick?: () => void;
  showViewSwitcher?: boolean;
  currentMapView?: MapViewMode;
  onMapViewChange?: (view: MapViewMode) => void;
  showGeoreference?: boolean;
  showAnnotation?: boolean;
  showDownload?: boolean;
  showSemantics?: boolean;
  showMeasure?: boolean;
  showSearch?: boolean;
  showSelect?: boolean;
  onSelectModeChange?: (mode: SelectMode, isActive: boolean) => void;
  onMeasureModeChange?: (mode: MeasureMode | null, isActive: boolean) => void;
  controlledSelectActive?: boolean;
  controlledMeasureActive?: boolean;
  // ── Georeference ──────────────────────────────────────────────────────────
  controlledGeorefActive?: boolean;
  onGeorefSave?: () => void;
  onGeorefCancel?: () => void;
  onGeorefOpacityChange?: (opacity: number) => void;
  onSearchHighlight?: () => void;
  searchMode?: 'toolbar' | 'floating';
}

// ── Shared tooltip pill style ──────────────────────────────────────────────
const TIP =
  '-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(235,243,255,0.96)] border border-[#95afe0] flex items-center justify-center left-1/2 px-[14px] py-[7px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(26,111,255,0.18)] top-[-44px] pointer-events-none z-50 whitespace-nowrap';
const TIP_TEXT =
  "font-['Figtree',sans-serif] font-semibold text-[13px] text-[#1a3d73]";

export function InteractiveToolbar({ 
  onViewModeChange,
  onGeoreferenceClick,
  onAnnotationClick,
  onDownloadClick,
  onSemanticsClick,
  showViewSwitcher,
  currentMapView,
  onMapViewChange,
  showGeoreference,
  showAnnotation,
  showDownload,
  showSemantics,
  showMeasure,
  showSearch,
  showSelect,
  onSelectModeChange,
  onMeasureModeChange,
  controlledSelectActive,
  controlledMeasureActive,
  controlledGeorefActive,
  onGeorefSave,
  onGeorefCancel,
  onGeorefOpacityChange,
  onSearchHighlight,
  searchMode,
}: InteractiveToolbarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('mesh');
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [selectMenuOpen, setSelectMenuOpen] = useState(false);
  const [measureMenuOpen, setMeasureMenuOpen] = useState(false);
  const [measureMode, setMeasureMode] = useState<MeasureMode>('distance');
  const [measureToolActive, setMeasureToolActive] = useState(false);
  const [downloadingOption, setDownloadingOption] = useState<DownloadOption | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState<SelectMode>('element');
  const [selectToolActive, setSelectToolActive] = useState(false);
  const [semanticsMode, setSemanticsMode] = useState(false);
  const [georefMode, setGeorefMode] = useState(false);
  const [georefOpacity, setGeorefOpacity] = useState(1);
  const [searchOpen, setSearchOpen]       = useState(false);

  const handleViewModeClick = (mode: ViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  const handleGeoreferenceClick = () => {
    setGeorefMode(true);
    setGeorefOpacity(1);
    setSearchOpen(false);
    onGeoreferenceClick?.();
  };
  const handleAnnotationClick   = () => { onAnnotationClick?.(); };
  const handleDownloadClick     = () => { setDownloadMenuOpen(!downloadMenuOpen); onDownloadClick?.(); };

  const handleSelectClick = () => {
    const next = !selectToolActive;
    setSelectToolActive(next);
    setSelectMenuOpen(false);
    onSelectModeChange?.(selectMode, next);
  };

  const handleSelectChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectMenuOpen(!selectMenuOpen);
  };

  const handleSelectModeChange = (mode: SelectMode) => {
    setSelectMode(mode);
    setSelectMenuOpen(false);
    setSelectToolActive(true);
    onSelectModeChange?.(mode, true);
  };

  const handleDownloadOption = (option: DownloadOption) => {
    setDownloadingOption(option);
    setTimeout(() => { setDownloadingOption(null); setDownloadMenuOpen(false); }, 2000);
  };

  const handleMeasureClick = () => {
    const next = !measureToolActive;
    setMeasureToolActive(next);
    setMeasureMenuOpen(false);
    onMeasureModeChange?.(next ? measureMode : null, next);
  };

  const handleMeasureChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMeasureMenuOpen(!measureMenuOpen);
  };

  const handleMeasureModeChange = (mode: MeasureMode) => {
    setMeasureMode(mode);
    setMeasureMenuOpen(false);
    setMeasureToolActive(true);
    onMeasureModeChange?.(mode, true);
  };

  const measureModeLabel: Record<MeasureMode, string> = {
    'distance':    'Measure distance',
    'volume':      'Measure volume',
    'surface-area':'Measure surface area',
  };

  // ── Sync external control → internal state ─────────────────────────────
  useEffect(() => {
    if (controlledSelectActive === false && selectToolActive) {
      setSelectToolActive(false);
      setSelectMenuOpen(false);
    }
  }, [controlledSelectActive]);

  useEffect(() => {
    if (controlledMeasureActive === false && measureToolActive) {
      setMeasureToolActive(false);
      setMeasureMenuOpen(false);
    }
  }, [controlledMeasureActive]);

  useEffect(() => {
    if (controlledGeorefActive === false && georefMode) {
      setGeorefMode(false);
    }
  }, [controlledGeorefActive]);

  // ── Shared instruction hint ────────────────────────────────────────────
  const InstructionHint = ({ children }: { children: React.ReactNode }) => (
    <div
      className="backdrop-blur-[4px] bg-[rgba(235,243,255,0.96)] px-5 py-2.5 rounded-[14px] border border-[#95afe0] shadow-[0px_0px_8px_0px_rgba(26,111,255,0.18)] pointer-events-none whitespace-nowrap"
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      <p className="text-[#1a3d73] text-center" style={{ fontSize: '13px', fontWeight: 500 }}>
        {children}
      </p>
    </div>
  );

  const currentToolbarMode = semanticsMode ? 'semantics' : georefMode ? 'georef' : 'main';

  return (
    <div className="relative flex flex-col items-center gap-3">

      {/* ── Active instruction hints ────────────────────────────────────── */}
      {selectToolActive && selectMode === 'element' && currentToolbarMode === 'main' && (
        <InstructionHint>Click an object in the scene to select it</InstructionHint>
      )}
      {measureToolActive && measureMode === 'distance' && currentToolbarMode === 'main' && (
        <InstructionHint>Click two points on the model to measure distance</InstructionHint>
      )}
      {currentToolbarMode === 'georef' && (
        <InstructionHint>Drag on the scene to rotate · adjust opacity below</InstructionHint>
      )}

      {/* ── Floating search panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && currentToolbarMode === 'main' && searchMode !== 'toolbar' && (
          <SearchChatPanel
            mode="floating"
            onClose={() => setSearchOpen(false)}
            onHighlight={() => { onSearchHighlight?.(); }}
          />
        )}
      </AnimatePresence>

      {/* Toolbar-locked: wrap compact search + toolbar together so they share width */}
      {searchMode === 'toolbar' ? (
        <div className="flex flex-col gap-2 items-stretch" style={{ width: 'fit-content' }}>
          <AnimatePresence>
            {searchOpen && currentToolbarMode === 'main' && (
              <SearchChatPanel
                mode="toolbar"
                onClose={() => setSearchOpen(false)}
                onHighlight={() => { onSearchHighlight?.(); }}
              />
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>

            {/* ════════════════════════════════════════════════════════════════
                GEOREFERENCE TOOLBAR
            ════════════════════════════════════════════════════════════════ */}
            {currentToolbarMode === 'georef' ? (
          <motion.div
            key="georef-toolbar"
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="backdrop-blur-[3px] bg-[rgba(238,244,255,0.88)] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[6px] py-[4px] relative rounded-[16px]"
          >
            <div aria-hidden="true" className="absolute border border-[#95afe0] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.15)]" />

            {/* Mode badge */}
            <div className="flex items-center gap-[7px] px-[10px] py-[8px] rounded-[11px] bg-[#2d5290] shrink-0">
              <div className="relative shrink-0 size-[15px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                  <path d={svgPaths.p3cc86080} fill="white" />
                </svg>
              </div>
              <span className="font-['Figtree',sans-serif] text-[13px] text-white whitespace-nowrap" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
                Georeference
              </span>
            </div>

            {/* Divider */}
            <div className="h-[40px] relative shrink-0 w-[1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 40">
                <path d="M0.5 0V40" stroke="#95afe0" strokeOpacity="0.6" />
              </svg>
            </div>

            {/* Opacity control */}
            <div className="flex items-center gap-[10px] px-[4px]">
              <span className="font-['Figtree',sans-serif] text-[12px] text-[#2d5290] whitespace-nowrap shrink-0" style={{ fontWeight: 600 }}>
                Opacity
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(georefOpacity * 100)}
                onChange={(e) => {
                  const v = Number(e.target.value) / 100;
                  setGeorefOpacity(v);
                  onGeorefOpacityChange?.(v);
                }}
                className="georef-slider w-[132px] h-[4px] rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #2d5290 ${Math.round(georefOpacity * 100)}%, #c8d4ec ${Math.round(georefOpacity * 100)}%)`,
                  accentColor: '#2d5290',
                }}
              />
              <span
                className="font-['Figtree',sans-serif] text-[12px] text-[#2d5290] w-[34px] text-right shrink-0"
                style={{ fontWeight: 600 }}
              >
                {Math.round(georefOpacity * 100)}%
              </span>
            </div>

            {/* Divider */}
            <div className="h-[40px] relative shrink-0 w-[1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 40">
                <path d="M0.5 0V40" stroke="#95afe0" strokeOpacity="0.6" />
              </svg>
            </div>

            {/* Save */}
            <button
              onClick={() => { setGeorefMode(false); onGeorefSave?.(); }}
              onMouseEnter={() => setHoveredButton('georef-save')}
              onMouseLeave={() => setHoveredButton(null)}
              className="flex items-center justify-center px-[14px] h-[34px] rounded-[10px] bg-[#2d5290] transition-opacity hover:opacity-90 shrink-0"
            >
              <span className="font-['Figtree',sans-serif] text-[13px] text-white whitespace-nowrap" style={{ fontWeight: 600 }}>
                Save
              </span>
            </button>

            {/* Cancel */}
            <button
              onClick={() => { setGeorefMode(false); onGeorefCancel?.(); }}
              onMouseEnter={() => setHoveredButton('georef-cancel')}
              onMouseLeave={() => setHoveredButton(null)}
              className="flex items-center justify-center px-[12px] h-[34px] rounded-[10px] transition-colors hover:bg-[rgba(45,82,144,0.1)] shrink-0"
            >
              <span className="font-['Figtree',sans-serif] text-[13px] text-[#2d5290] whitespace-nowrap" style={{ fontWeight: 600 }}>
                Cancel
              </span>
            </button>

          </motion.div>

        ) : currentToolbarMode === 'semantics' ? (
          <motion.div
            key="semantics-toolbar"
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="backdrop-blur-[3px] bg-[rgba(238,244,255,0.88)] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[6px] py-[4px] relative rounded-[16px]"
            data-name="Semantics Toolbar"
          >
            <div aria-hidden="true" className="absolute border border-[#95afe0] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.15)]" />

            {/* Mode badge */}
            <div className="flex items-center gap-[7px] px-[10px] py-[8px] rounded-[11px] bg-[#2d5290] shrink-0">
              <div className="relative shrink-0 size-[15px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
                  <path d={semanticsSvgPaths.p3e65af00} fill="white" />
                </svg>
              </div>
              <span className="font-['Figtree',sans-serif] text-[13px] text-white whitespace-nowrap" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
                Semantics
              </span>
            </div>

            {/* Divider */}
            <div className="h-[40px] relative shrink-0 w-[1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 40">
                <path d="M0.5 0V40" stroke="#95afe0" strokeOpacity="0.6" />
              </svg>
            </div>

            {/* Tools */}
            <div className="content-stretch flex gap-[4px] items-start relative shrink-0">

              {/* Select — icon + chevron split */}
              <div className="relative">
                {hoveredButton === 'sem-select' && !selectMenuOpen && !selectToolActive && (
                  <div className={TIP}>
                    <p className={TIP_TEXT}>
                      {selectMode === 'element' ? 'Select element' : selectMode === 'boundary' ? 'Draw boundary' : 'Find by photo'}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-[2px]">
                  <button
                    onClick={handleSelectClick}
                    onMouseEnter={() => setHoveredButton('sem-select')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className={`flex items-center justify-center pl-[12px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${
                      selectToolActive ? 'bg-[#95afe0]' : 'hover:bg-[rgba(45,82,144,0.1)]'
                    }`}
                  >
                    {selectMode === 'boundary' && selectToolActive
                      ? <SquareDashed className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                      : <MousePointer className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                    }
                  </button>
                  <button
                    onClick={handleSelectChevronClick}
                    onMouseEnter={() => setHoveredButton('sem-select-chev')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className={`flex items-center justify-center pl-[2px] pr-[6px] h-[40px] rounded-[12px] transition-colors ${
                      hoveredButton === 'sem-select-chev' ? 'bg-[rgba(45,82,144,0.1)]' : 'bg-transparent'
                    }`}
                  >
                    <ChevronDown className="size-[12px] text-[#0C1220]" strokeWidth={2.5} />
                  </button>
                </div>
                {selectMenuOpen && (
                  <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50">
                    <div className="flex flex-col p-[4px] gap-[2px]">
                      <button onClick={() => handleSelectModeChange('element')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'element' ? 'bg-[#eef4ff]' : ''}`}>
                        <MousePointer className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Select element</span>
                      </button>
                      <button onClick={() => handleSelectModeChange('boundary')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'boundary' ? 'bg-[#eef4ff]' : ''}`}>
                        <SquareDashed className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Draw boundary</span>
                      </button>
                      <button onClick={() => handleSelectModeChange('visual-search')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'visual-search' ? 'bg-[#eef4ff]' : ''}`}>
                        <Camera className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Find by photo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Measure — icon + chevron split */}
              <div className="relative">
                {hoveredButton === 'sem-measure' && !measureMenuOpen && !measureToolActive && (
                  <div className={TIP}>
                    <p className={TIP_TEXT}>{measureModeLabel[measureMode]}</p>
                  </div>
                )}
                <div className="flex items-center gap-[2px]">
                  <button
                    onClick={handleMeasureClick}
                    onMouseEnter={() => setHoveredButton('sem-measure')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className={`flex items-center justify-center pl-[12px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${
                      measureToolActive ? 'bg-[#95afe0]' : 'hover:bg-[rgba(45,82,144,0.1)]'
                    }`}
                  >
                    <div className="overflow-clip relative shrink-0 size-[20px]">
                      <div className="absolute flex inset-[5%_5%_5.99%_5.38%] items-center justify-center">
                        <div className="flex-none h-[9.474px] rotate-[-44.22deg] w-[15.791px]">
                          <div className="relative size-full">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7906 9.47436">
                              <path d={rulerSvgPaths.pef0d600} fill="var(--fill-0, #0C1220)" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleMeasureChevronClick}
                    onMouseEnter={() => setHoveredButton('sem-measure-chev')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className={`flex items-center justify-center pl-[2px] pr-[6px] h-[40px] rounded-[12px] transition-colors ${
                      hoveredButton === 'sem-measure-chev' ? 'bg-[rgba(45,82,144,0.1)]' : 'bg-transparent'
                    }`}
                  >
                    <ChevronDown className="size-[12px] text-[#0C1220]" strokeWidth={2.5} />
                  </button>
                </div>
                {measureMenuOpen && (
                  <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50">
                    <div className="flex flex-col p-[4px] gap-[2px]">
                      <button onClick={() => handleMeasureModeChange('distance')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'distance' ? 'bg-[#eef4ff]' : ''}`}>
                        <Ruler className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure distance</span>
                      </button>
                      <button onClick={() => handleMeasureModeChange('volume')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'volume' ? 'bg-[#eef4ff]' : ''}`}>
                        <Box className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure volume</span>
                      </button>
                      <button onClick={() => handleMeasureModeChange('surface-area')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'surface-area' ? 'bg-[#eef4ff]' : ''}`}>
                        <Layers className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure surface area</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => console.log('Semantics search clicked')}
                  onMouseEnter={() => setHoveredButton('sem-search')}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[rgba(45,82,144,0.1)]"
                >
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <div className="absolute inset-[5%]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                        <path d={searchSvgPaths.p16b4a380} fill="var(--fill-0, #0C1220)" />
                      </svg>
                    </div>
                  </div>
                </button>
                {hoveredButton === 'sem-search' && (
                  <div className={TIP}><p className={TIP_TEXT}>Search</p></div>
                )}
              </div>

            </div>

            {/* Divider */}
            <div className="h-[40px] relative shrink-0 w-[1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 40">
                <path d="M0.5 0V40" stroke="#95afe0" strokeOpacity="0.6" />
              </svg>
            </div>

            {/* Exit */}
            <div className="relative">
              <button
                onClick={() => setSemanticsMode(false)}
                onMouseEnter={() => setHoveredButton('sem-exit')}
                onMouseLeave={() => setHoveredButton(null)}
                className="flex items-center justify-center px-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[rgba(45,82,144,0.1)]"
              >
                <X className="size-[16px] text-[#0C1220]" strokeWidth={2.5} />
              </button>
              {hoveredButton === 'sem-exit' && (
                <div className={TIP}><p className={TIP_TEXT}>Exit Semantics</p></div>
              )}
            </div>

          </motion.div>

        ) : (

        /* ════════════════════════════════════════════════════════════════
            MAIN TOOLBAR
        ════════════════════════════════════════════════════════════════ */
        /* currentToolbarMode === 'main' */
          <motion.div
            key="main-toolbar"
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[8px] items-center justify-center pl-[4px] pr-[8px] py-[4px] relative rounded-[16px]"
            data-name="Tool bar 2.0"
          >
            <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_0px_3px_0px_rgba(0,0,0,0.15)]" />
            
            {/* View toggles */}
            <div className="bg-[#d5dcec] content-stretch flex gap-[4px] items-center p-[4px] relative rounded-[12px] shrink-0" data-name="View toggles">
              <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-0 pointer-events-none rounded-[12px]" />
              
              {/* Mesh */}
              <div className="relative">
                <button
                  onClick={() => handleViewModeClick('mesh')}
                  onMouseEnter={() => setHoveredButton('mesh')}
                  onMouseLeave={() => setHoveredButton(null)}
                  className={`flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors ${
                    viewMode === 'mesh' ? 'bg-[#95afe0]' : 'bg-transparent hover:bg-[#eef4ff]'
                  }`}
                >
                  <div className="overflow-clip relative shrink-0 size-[28px]">
                    <div className="absolute inset-[20.24%_4.46%_20.28%_5%]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.3518 16.6537">
                        <path clipRule="evenodd" d={svgPaths.p268ac100} fill="var(--fill-0, #0C1220)" fillRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </button>
                {hoveredButton === 'mesh' && (
                  <div className={TIP} data-name="Tool Tips"><p className={TIP_TEXT}>Mesh</p></div>
                )}
              </div>
              
              {/* Splat */}
              <div className="relative">
                <button
                  onClick={() => handleViewModeClick('splat')}
                  onMouseEnter={() => setHoveredButton('splat')}
                  onMouseLeave={() => setHoveredButton(null)}
                  className={`flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors ${
                    viewMode === 'splat' ? 'bg-[#95afe0]' : 'bg-transparent hover:bg-[#eef4ff]'
                  }`}
                >
                  <div className="overflow-clip relative shrink-0 size-[28px]">
                    <div className="absolute inset-[20.64%_5%_20.62%_5%]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.2 16.4459">
                        <path clipRule="evenodd" d={svgPaths.p3d8c0d00} fill="var(--fill-0, #0C1220)" fillRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </button>
                {hoveredButton === 'splat' && (
                  <div className={TIP} data-name="Tool Tips"><p className={TIP_TEXT}>Splat</p></div>
                )}
              </div>
            </div>
            
            {/* Map View Switcher */}
            {showViewSwitcher && currentMapView && onMapViewChange && (
              <MapViewSwitcher
                currentView={currentMapView}
                onViewChange={onMapViewChange}
                location="toolbar"
              />
            )}
            
            {/* Divider */}
            {(showGeoreference || showAnnotation || showMeasure || showSearch || showSelect) && (
              <div className="flex flex-row items-center self-stretch">
                <div className="h-full relative shrink-0 w-0">
                  <div className="absolute inset-[0_-0.5px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 48">
                      <path d="M0.5 0V48" stroke="var(--stroke-0, #D5DCEC)" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tools */}
            {(showGeoreference || showAnnotation || showMeasure || showSearch || showSelect) && (
              <div className="content-stretch flex gap-[4px] items-start relative shrink-0" data-name="Tools">

                {/* Select — icon + chevron split */}
                {showSelect && (
                  <div className="relative">
                    {hoveredButton === 'select' && !selectMenuOpen && !selectToolActive && (
                      <div className={TIP} data-name="Tool Tips">
                        <p className={TIP_TEXT}>
                          {selectMode === 'element' ? 'Select element' : selectMode === 'boundary' ? 'Draw boundary' : 'Find by photo'}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-[2px]">
                      <button
                        onClick={handleSelectClick}
                        onMouseEnter={() => setHoveredButton('select')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className={`flex items-center justify-center pl-[12px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${
                          selectToolActive ? 'bg-[#95afe0]' : 'hover:bg-[#eef4ff]'
                        }`}
                      >
                        {selectMode === 'boundary' && selectToolActive
                          ? <SquareDashed className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                          : <MousePointer className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                        }
                      </button>
                      <button
                        onClick={handleSelectChevronClick}
                        onMouseEnter={() => setHoveredButton('select-chev')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className={`flex items-center justify-center pl-[2px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${
                          hoveredButton === 'select-chev' ? 'bg-[#eef4ff]' : 'bg-transparent'
                        }`}
                      >
                        <ChevronDown className="size-[12px] text-[#0C1220]" strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Select Menu */}
                    {selectMenuOpen && (
                      <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50" data-name="Select Menu">
                        <div className="flex flex-col p-[4px] gap-[2px]">
                          <button onClick={() => handleSelectModeChange('element')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'element' ? 'bg-[#eef4ff]' : ''}`}>
                            <MousePointer className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                            <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Select element</span>
                          </button>
                          <button onClick={() => handleSelectModeChange('boundary')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'boundary' ? 'bg-[#eef4ff]' : ''}`}>
                            <SquareDashed className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                            <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Draw boundary</span>
                          </button>
                          <button onClick={() => handleSelectModeChange('visual-search')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'visual-search' ? 'bg-[#eef4ff]' : ''}`}>
                            <Camera className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                            <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Find by photo</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Measure — icon + chevron split */}
                {showMeasure && (
                  <div className="relative">
                    {hoveredButton === 'measure' && !measureMenuOpen && !measureToolActive && (
                      <div className={TIP} data-name="Tool Tips">
                        <p className={TIP_TEXT}>{measureModeLabel[measureMode]}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-[2px]">
                      <button
                        onClick={handleMeasureClick}
                        onMouseEnter={() => setHoveredButton('measure')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className={`flex items-center justify-center pl-[12px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${
                          measureToolActive ? 'bg-[#95afe0]' : 'hover:bg-[#eef4ff]'
                        }`}
                      >
                        <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Measure">
                          <div className="absolute flex inset-[5%_5%_5.99%_5.38%] items-center justify-center">
                            <div className="flex-none h-[9.474px] rotate-[-44.22deg] w-[15.791px]">
                              <div className="relative size-full" data-name="Icon Content">
                                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7906 9.47436">
                                  <path d={rulerSvgPaths.pef0d600} fill="var(--fill-0, #0C1220)" id="Icon Content" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={handleMeasureChevronClick}
                        onMouseEnter={() => setHoveredButton('measure-chev')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className={`flex items-center justify-center pl-[2px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${
                          hoveredButton === 'measure-chev' ? 'bg-[#eef4ff]' : 'bg-transparent'
                        }`}
                      >
                        <ChevronDown className="size-[12px] text-[#0C1220]" strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Measure Menu */}
                    {measureMenuOpen && (
                      <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50" data-name="Measure Menu">
                        <div className="flex flex-col p-[4px] gap-[2px]">
                          <button onClick={() => handleMeasureModeChange('distance')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'distance' ? 'bg-[#eef4ff]' : ''}`}>
                            <Ruler className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                            <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure distance</span>
                          </button>
                          <button onClick={() => handleMeasureModeChange('volume')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'volume' ? 'bg-[#eef4ff]' : ''}`}>
                            <Box className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                            <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure volume</span>
                          </button>
                          <button onClick={() => handleMeasureModeChange('surface-area')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'surface-area' ? 'bg-[#eef4ff]' : ''}`}>
                            <Layers className="size-[16px] text-[#0C1220]" strokeWidth={2} />
                            <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure surface area</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Annotation */}
                {showAnnotation && (
                  <div className="relative">
                    <button
                      onClick={handleAnnotationClick}
                      onMouseEnter={() => setHoveredButton('annotation')}
                      onMouseLeave={() => setHoveredButton(null)}
                      className="flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[#eef4ff]"
                    >
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute inset-[5%_9.95%_5%_11.53%]">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7037 18">
                            <path d={svgPaths.pea92100} fill="var(--fill-0, #0C1220)" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    {hoveredButton === 'annotation' && (
                      <div className={TIP} data-name="Tool Tips"><p className={TIP_TEXT}>Annotation</p></div>
                    )}
                  </div>
                )}
                
                {/* Georeference */}
                {showGeoreference && (
                  <div className="relative">
                    <button
                      onClick={handleGeoreferenceClick}
                      onMouseEnter={() => setHoveredButton('georeference')}
                      onMouseLeave={() => setHoveredButton(null)}
                      className="flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[#eef4ff]"
                    >
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="-translate-y-1/2 absolute aspect-[20/20] left-[5%] right-[5%] top-1/2">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                            <path d={svgPaths.p3cc86080} fill="var(--fill-0, #0C1220)" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    {hoveredButton === 'georeference' && (
                      <div className={TIP} data-name="Tool Tips"><p className={TIP_TEXT}>Georeference</p></div>
                    )}
                  </div>
                )}
                
                {/* Search */}
                {showSearch && (
                  <div className="relative">
                    <button
                      onClick={() => setSearchOpen((o) => !o)}
                      onMouseEnter={() => setHoveredButton('search')}
                      onMouseLeave={() => setHoveredButton(null)}
                      className={`flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors ${
                        searchOpen ? 'bg-[#95afe0]' : 'bg-transparent hover:bg-[#eef4ff]'
                      }`}
                    >
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute inset-[5%]">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                            <path d={searchSvgPaths.p16b4a380} fill="var(--fill-0, #0C1220)" id="Icon Content" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    {hoveredButton === 'search' && (
                      <div className={TIP} data-name="Tool Tips"><p className={TIP_TEXT}>Search</p></div>
                    )}
                  </div>
                )}

              </div>
            )}
            
            {/* Actions divider */}
            {(showSemantics || showDownload) && (
              <div className="h-[48px] relative shrink-0 w-[1px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 48">
                  <path d="M0.5 0V48" stroke="var(--stroke-0, #D5DCEC)" />
                </svg>
              </div>
            )}

            {/* Semantics */}
            {showSemantics && (
              <div className="relative">
                <button
                  onClick={() => setSemanticsMode(true)}
                  onMouseEnter={() => setHoveredButton('semantics')}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[#eef4ff]"
                >
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
                      <path d={semanticsSvgPaths.p3e65af00} fill="var(--fill-0, #0C1220)" />
                    </svg>
                  </div>
                </button>
                {hoveredButton === 'semantics' && (
                  <div className={TIP} data-name="Tool Tips"><p className={TIP_TEXT}>Semantics</p></div>
                )}
              </div>
            )}

            {/* Download */}
            {showDownload && (
              <div className="relative">
                <button
                  onClick={handleDownloadClick}
                  onMouseEnter={() => setHoveredButton('download')}
                  onMouseLeave={() => setHoveredButton(null)}
                  className={`flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors ${
                    downloadMenuOpen ? 'bg-[#95afe0]' : 'bg-transparent hover:bg-[#eef4ff]'
                  }`}
                >
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <div className="absolute inset-[5%_10%]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
                        <path d={downloadSvgPaths.p3fd3bc00} fill="var(--fill-0, #0C1220)" id="Icon Content" />
                      </svg>
                    </div>
                  </div>
                </button>
                {hoveredButton === 'download' && !downloadMenuOpen && (
                  <div className={TIP} data-name="Tool Tips"><p className={TIP_TEXT}>Download</p></div>
                )}
                
                {/* Download Menu */}
                {downloadMenuOpen && (
                  <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50" data-name="Download Menu">
                    <div className="flex flex-col p-[4px] gap-[2px]">
                      <button
                        onClick={() => handleDownloadOption('mesh')}
                        disabled={downloadingOption !== null}
                        className="flex items-center justify-between px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap gap-[24px]"
                      >
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Mesh (fbx)</span>
                        {downloadingOption === 'mesh' && (
                          <div className="animate-spin h-4 w-4 border-2 border-[#95afe0] border-t-transparent rounded-full" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadOption('compressed')}
                        disabled={downloadingOption !== null}
                        className="flex items-center justify-between px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap gap-[24px]"
                      >
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Compressed splat (SPZ)</span>
                        {downloadingOption === 'compressed' && (
                          <div className="animate-spin h-4 w-4 border-2 border-[#95afe0] border-t-transparent rounded-full" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadOption('uncompressed')}
                        disabled={downloadingOption !== null}
                        className="flex items-center justify-between px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap gap-[24px]"
                      >
                        <span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Uncompressed splat (PLY)</span>
                        {downloadingOption === 'uncompressed' && (
                          <div className="animate-spin h-4 w-4 border-2 border-[#95afe0] border-t-transparent rounded-full" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}

          </AnimatePresence>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>

          {/* ════════════════════════════════════════════════════════════════
              GEOREFERENCE TOOLBAR
          ════════════════════════════════════════════════════════════════ */}
          {currentToolbarMode === 'georef' ? (
            <motion.div
              key="georef-toolbar-f"
              initial={{ opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="backdrop-blur-[3px] bg-[rgba(238,244,255,0.88)] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[6px] py-[4px] relative rounded-[16px]"
            >
              <div aria-hidden="true" className="absolute border border-[#95afe0] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.15)]" />
              <div className="flex items-center gap-[7px] px-[10px] py-[8px] rounded-[11px] bg-[#2d5290] shrink-0">
                <div className="relative shrink-0 size-[15px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                    <path d={svgPaths.p3cc86080} fill="white" />
                  </svg>
                </div>
                <span className="font-['Figtree',sans-serif] text-[13px] text-white whitespace-nowrap" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
                  Georeference
                </span>
              </div>
              <div className="h-[40px] relative shrink-0 w-[1px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 40">
                  <path d="M0.5 0V40" stroke="#95afe0" strokeOpacity="0.6" />
                </svg>
              </div>
              <div className="flex items-center gap-[10px] px-[4px]">
                <span className="font-['Figtree',sans-serif] text-[12px] text-[#2d5290] whitespace-nowrap shrink-0" style={{ fontWeight: 600 }}>
                  Opacity
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(georefOpacity * 100)}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    setGeorefOpacity(v);
                    onGeorefOpacityChange?.(v);
                  }}
                  className="georef-slider w-[132px] h-[4px] rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2d5290 ${Math.round(georefOpacity * 100)}%, #c8d4ec ${Math.round(georefOpacity * 100)}%)`,
                    accentColor: '#2d5290',
                  }}
                />
                <span className="font-['Figtree',sans-serif] text-[12px] text-[#2d5290] w-[34px] text-right shrink-0" style={{ fontWeight: 600 }}>
                  {Math.round(georefOpacity * 100)}%
                </span>
              </div>
              <div className="h-[40px] relative shrink-0 w-[1px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 40">
                  <path d="M0.5 0V40" stroke="#95afe0" strokeOpacity="0.6" />
                </svg>
              </div>
              <button
                onClick={() => { setGeorefMode(false); onGeorefSave?.(); }}
                className="flex items-center justify-center px-[14px] h-[34px] rounded-[10px] bg-[#2d5290] transition-opacity hover:opacity-90 shrink-0"
              >
                <span className="font-['Figtree',sans-serif] text-[13px] text-white whitespace-nowrap" style={{ fontWeight: 600 }}>Save</span>
              </button>
              <button
                onClick={() => { setGeorefMode(false); onGeorefCancel?.(); }}
                className="flex items-center justify-center px-[12px] h-[34px] rounded-[10px] transition-colors hover:bg-[rgba(45,82,144,0.1)] shrink-0"
              >
                <span className="font-['Figtree',sans-serif] text-[13px] text-[#2d5290] whitespace-nowrap" style={{ fontWeight: 600 }}>Cancel</span>
              </button>
            </motion.div>

          ) : currentToolbarMode === 'semantics' ? (
            <motion.div
              key="semantics-toolbar-f"
              initial={{ opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="backdrop-blur-[3px] bg-[rgba(238,244,255,0.88)] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[6px] py-[4px] relative rounded-[16px]"
              data-name="Semantics Toolbar"
            >
              <div aria-hidden="true" className="absolute border border-[#95afe0] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.15)]" />
              <div className="flex items-center gap-[7px] px-[10px] py-[8px] rounded-[11px] bg-[#2d5290] shrink-0">
                <div className="relative shrink-0 size-[15px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
                    <path d={semanticsSvgPaths.p3e65af00} fill="white" />
                  </svg>
                </div>
                <span className="font-['Figtree',sans-serif] text-[13px] text-white whitespace-nowrap" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
                  Semantics
                </span>
              </div>
              <div className="h-[40px] relative shrink-0 w-[1px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 40">
                  <path d="M0.5 0V40" stroke="#95afe0" strokeOpacity="0.6" />
                </svg>
              </div>
              <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
                <div className="relative">
                  {hoveredButton === 'sem-select' && !selectMenuOpen && !selectToolActive && (
                    <div className={TIP}><p className={TIP_TEXT}>{selectMode === 'element' ? 'Select element' : selectMode === 'boundary' ? 'Draw boundary' : 'Find by photo'}</p></div>
                  )}
                  <div className="flex items-center gap-[2px]">
                    <button onClick={handleSelectClick} onMouseEnter={() => setHoveredButton('sem-select')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center pl-[12px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${selectToolActive ? 'bg-[#95afe0]' : 'hover:bg-[rgba(45,82,144,0.1)]'}`}>
                      {selectMode === 'boundary' && selectToolActive ? <SquareDashed className="size-[16px] text-[#0C1220]" strokeWidth={2} /> : <MousePointer className="size-[16px] text-[#0C1220]" strokeWidth={2} />}
                    </button>
                    <button onClick={handleSelectChevronClick} onMouseEnter={() => setHoveredButton('sem-select-chev')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center pl-[2px] pr-[6px] h-[40px] rounded-[12px] transition-colors ${hoveredButton === 'sem-select-chev' ? 'bg-[rgba(45,82,144,0.1)]' : 'bg-transparent'}`}>
                      <ChevronDown className="size-[12px] text-[#0C1220]" strokeWidth={2.5} />
                    </button>
                  </div>
                  {selectMenuOpen && (
                    <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50">
                      <div className="flex flex-col p-[4px] gap-[2px]">
                        <button onClick={() => handleSelectModeChange('element')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'element' ? 'bg-[#eef4ff]' : ''}`}><MousePointer className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Select element</span></button>
                        <button onClick={() => handleSelectModeChange('boundary')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'boundary' ? 'bg-[#eef4ff]' : ''}`}><SquareDashed className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Draw boundary</span></button>
                        <button onClick={() => handleSelectModeChange('visual-search')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'visual-search' ? 'bg-[#eef4ff]' : ''}`}><Camera className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Find by photo</span></button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  {hoveredButton === 'sem-measure' && !measureMenuOpen && !measureToolActive && (
                    <div className={TIP}><p className={TIP_TEXT}>{measureModeLabel[measureMode]}</p></div>
                  )}
                  <div className="flex items-center gap-[2px]">
                    <button onClick={handleMeasureClick} onMouseEnter={() => setHoveredButton('sem-measure')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center pl-[12px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${measureToolActive ? 'bg-[#95afe0]' : 'hover:bg-[rgba(45,82,144,0.1)]'}`}>
                      <div className="overflow-clip relative shrink-0 size-[20px]"><div className="absolute flex inset-[5%_5%_5.99%_5.38%] items-center justify-center"><div className="flex-none h-[9.474px] rotate-[-44.22deg] w-[15.791px]"><div className="relative size-full"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7906 9.47436"><path d={rulerSvgPaths.pef0d600} fill="var(--fill-0, #0C1220)" /></svg></div></div></div></div>
                    </button>
                    <button onClick={handleMeasureChevronClick} onMouseEnter={() => setHoveredButton('sem-measure-chev')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center pl-[2px] pr-[6px] h-[40px] rounded-[12px] transition-colors ${hoveredButton === 'sem-measure-chev' ? 'bg-[rgba(45,82,144,0.1)]' : 'bg-transparent'}`}>
                      <ChevronDown className="size-[12px] text-[#0C1220]" strokeWidth={2.5} />
                    </button>
                  </div>
                  {measureMenuOpen && (
                    <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50">
                      <div className="flex flex-col p-[4px] gap-[2px]">
                        <button onClick={() => handleMeasureModeChange('distance')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'distance' ? 'bg-[#eef4ff]' : ''}`}><Ruler className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure distance</span></button>
                        <button onClick={() => handleMeasureModeChange('volume')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'volume' ? 'bg-[#eef4ff]' : ''}`}><Box className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure volume</span></button>
                        <button onClick={() => handleMeasureModeChange('surface-area')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'surface-area' ? 'bg-[#eef4ff]' : ''}`}><Layers className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure surface area</span></button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => console.log('Semantics search clicked')} onMouseEnter={() => setHoveredButton('sem-search')} onMouseLeave={() => setHoveredButton(null)} className="flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[rgba(45,82,144,0.1)]">
                    <div className="overflow-clip relative shrink-0 size-[20px]"><div className="absolute inset-[5%]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18"><path d={searchSvgPaths.p16b4a380} fill="var(--fill-0, #0C1220)" /></svg></div></div>
                  </button>
                  {hoveredButton === 'sem-search' && (<div className={TIP}><p className={TIP_TEXT}>Search</p></div>)}
                </div>
              </div>
              <div className="h-[40px] relative shrink-0 w-[1px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 40">
                  <path d="M0.5 0V40" stroke="#95afe0" strokeOpacity="0.6" />
                </svg>
              </div>
              <div className="relative">
                <button onClick={() => setSemanticsMode(false)} onMouseEnter={() => setHoveredButton('sem-exit')} onMouseLeave={() => setHoveredButton(null)} className="flex items-center justify-center px-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[rgba(45,82,144,0.1)]">
                  <X className="size-[16px] text-[#0C1220]" strokeWidth={2.5} />
                </button>
                {hoveredButton === 'sem-exit' && (<div className={TIP}><p className={TIP_TEXT}>Exit Semantics</p></div>)}
              </div>
            </motion.div>

          ) : (

          /* ════════════════════════════════════════════════════════════════
              MAIN TOOLBAR
          ════════════════════════════════════════════════════════════════ */
            <motion.div
              key="main-toolbar-f"
              initial={{ opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[8px] items-center justify-center pl-[4px] pr-[8px] py-[4px] relative rounded-[16px]"
              data-name="Tool bar 2.0"
            >
              <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_0px_3px_0px_rgba(0,0,0,0.15)]" />
              <div className="bg-[#d5dcec] content-stretch flex gap-[4px] items-center p-[4px] relative rounded-[12px] shrink-0">
                <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-0 pointer-events-none rounded-[12px]" />
                <div className="relative">
                  <button onClick={() => handleViewModeClick('mesh')} onMouseEnter={() => setHoveredButton('mesh')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors ${viewMode === 'mesh' ? 'bg-[#95afe0]' : 'bg-transparent hover:bg-[#eef4ff]'}`}>
                    <div className="overflow-clip relative shrink-0 size-[28px]"><div className="absolute inset-[20.24%_4.46%_20.28%_5%]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.3518 16.6537"><path clipRule="evenodd" d={svgPaths.p268ac100} fill="var(--fill-0, #0C1220)" fillRule="evenodd" /></svg></div></div>
                  </button>
                  {hoveredButton === 'mesh' && (<div className={TIP}><p className={TIP_TEXT}>Mesh</p></div>)}
                </div>
                <div className="relative">
                  <button onClick={() => handleViewModeClick('splat')} onMouseEnter={() => setHoveredButton('splat')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors ${viewMode === 'splat' ? 'bg-[#95afe0]' : 'bg-transparent hover:bg-[#eef4ff]'}`}>
                    <div className="overflow-clip relative shrink-0 size-[28px]"><div className="absolute inset-[20.64%_5%_20.62%_5%]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.2 16.4459"><path clipRule="evenodd" d={svgPaths.p3d8c0d00} fill="var(--fill-0, #0C1220)" fillRule="evenodd" /></svg></div></div>
                  </button>
                  {hoveredButton === 'splat' && (<div className={TIP}><p className={TIP_TEXT}>Splat</p></div>)}
                </div>
              </div>
              {showViewSwitcher && currentMapView && onMapViewChange && (
                <MapViewSwitcher currentView={currentMapView} onViewChange={onMapViewChange} location="toolbar" />
              )}
              {(showGeoreference || showAnnotation || showMeasure || showSearch || showSelect) && (
                <div className="flex flex-row items-center self-stretch">
                  <div className="h-full relative shrink-0 w-0"><div className="absolute inset-[0_-0.5px]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 48"><path d="M0.5 0V48" stroke="var(--stroke-0, #D5DCEC)" /></svg></div></div>
                </div>
              )}
              {(showGeoreference || showAnnotation || showMeasure || showSearch || showSelect) && (
                <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
                  {showSelect && (
                    <div className="relative">
                      {hoveredButton === 'select' && !selectMenuOpen && !selectToolActive && (<div className={TIP}><p className={TIP_TEXT}>{selectMode === 'element' ? 'Select element' : selectMode === 'boundary' ? 'Draw boundary' : 'Find by photo'}</p></div>)}
                      <div className="flex items-center gap-[2px]">
                        <button onClick={handleSelectClick} onMouseEnter={() => setHoveredButton('select')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center pl-[12px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${selectToolActive ? 'bg-[#95afe0]' : 'hover:bg-[#eef4ff]'}`}>
                          {selectMode === 'boundary' && selectToolActive ? <SquareDashed className="size-[16px] text-[#0C1220]" strokeWidth={2} /> : <MousePointer className="size-[16px] text-[#0C1220]" strokeWidth={2} />}
                        </button>
                        <button onClick={handleSelectChevronClick} onMouseEnter={() => setHoveredButton('select-chev')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center pl-[2px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${hoveredButton === 'select-chev' ? 'bg-[#eef4ff]' : 'bg-transparent'}`}>
                          <ChevronDown className="size-[12px] text-[#0C1220]" strokeWidth={2.5} />
                        </button>
                      </div>
                      {selectMenuOpen && (
                        <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50">
                          <div className="flex flex-col p-[4px] gap-[2px]">
                            <button onClick={() => handleSelectModeChange('element')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'element' ? 'bg-[#eef4ff]' : ''}`}><MousePointer className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Select element</span></button>
                            <button onClick={() => handleSelectModeChange('boundary')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'boundary' ? 'bg-[#eef4ff]' : ''}`}><SquareDashed className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Draw boundary</span></button>
                            <button onClick={() => handleSelectModeChange('visual-search')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${selectMode === 'visual-search' ? 'bg-[#eef4ff]' : ''}`}><Camera className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Find by photo</span></button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {showMeasure && (
                    <div className="relative">
                      {hoveredButton === 'measure' && !measureMenuOpen && !measureToolActive && (<div className={TIP}><p className={TIP_TEXT}>{measureModeLabel[measureMode]}</p></div>)}
                      <div className="flex items-center gap-[2px]">
                        <button onClick={handleMeasureClick} onMouseEnter={() => setHoveredButton('measure')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center pl-[12px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${measureToolActive ? 'bg-[#95afe0]' : 'hover:bg-[#eef4ff]'}`}>
                          <div className="overflow-clip relative shrink-0 size-[20px]"><div className="absolute flex inset-[5%_5%_5.99%_5.38%] items-center justify-center"><div className="flex-none h-[9.474px] rotate-[-44.22deg] w-[15.791px]"><div className="relative size-full"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7906 9.47436"><path d={rulerSvgPaths.pef0d600} fill="var(--fill-0, #0C1220)" /></svg></div></div></div></div>
                        </button>
                        <button onClick={handleMeasureChevronClick} onMouseEnter={() => setHoveredButton('measure-chev')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center pl-[2px] pr-[8px] h-[40px] rounded-[12px] transition-colors ${hoveredButton === 'measure-chev' ? 'bg-[#eef4ff]' : 'bg-transparent'}`}>
                          <ChevronDown className="size-[12px] text-[#0C1220]" strokeWidth={2.5} />
                        </button>
                      </div>
                      {measureMenuOpen && (
                        <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50">
                          <div className="flex flex-col p-[4px] gap-[2px]">
                            <button onClick={() => handleMeasureModeChange('distance')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'distance' ? 'bg-[#eef4ff]' : ''}`}><Ruler className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure distance</span></button>
                            <button onClick={() => handleMeasureModeChange('volume')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'volume' ? 'bg-[#eef4ff]' : ''}`}><Box className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure volume</span></button>
                            <button onClick={() => handleMeasureModeChange('surface-area')} className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors whitespace-nowrap ${measureMode === 'surface-area' ? 'bg-[#eef4ff]' : ''}`}><Layers className="size-[16px] text-[#0C1220]" strokeWidth={2} /><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Measure surface area</span></button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {showAnnotation && (
                    <div className="relative">
                      <button onClick={handleAnnotationClick} onMouseEnter={() => setHoveredButton('annotation')} onMouseLeave={() => setHoveredButton(null)} className="flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[#eef4ff]">
                        <div className="overflow-clip relative shrink-0 size-[20px]"><div className="absolute inset-[5%_9.95%_5%_11.53%]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7037 18"><path d={svgPaths.pea92100} fill="var(--fill-0, #0C1220)" /></svg></div></div>
                      </button>
                      {hoveredButton === 'annotation' && (<div className={TIP}><p className={TIP_TEXT}>Annotation</p></div>)}
                    </div>
                  )}
                  {showGeoreference && (
                    <div className="relative">
                      <button onClick={handleGeoreferenceClick} onMouseEnter={() => setHoveredButton('georeference')} onMouseLeave={() => setHoveredButton(null)} className="flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[#eef4ff]">
                        <div className="overflow-clip relative shrink-0 size-[20px]"><div className="-translate-y-1/2 absolute aspect-[20/20] left-[5%] right-[5%] top-1/2"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18"><path d={svgPaths.p3cc86080} fill="var(--fill-0, #0C1220)" /></svg></div></div>
                      </button>
                      {hoveredButton === 'georeference' && (<div className={TIP}><p className={TIP_TEXT}>Georeference</p></div>)}
                    </div>
                  )}
                  {showSearch && (
                    <div className="relative">
                      <button onClick={() => setSearchOpen((o) => !o)} onMouseEnter={() => setHoveredButton('search')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors ${searchOpen ? 'bg-[#95afe0]' : 'bg-transparent hover:bg-[#eef4ff]'}`}>
                        <div className="overflow-clip relative shrink-0 size-[20px]"><div className="absolute inset-[5%]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18"><path d={searchSvgPaths.p16b4a380} fill="var(--fill-0, #0C1220)" /></svg></div></div>
                      </button>
                      {hoveredButton === 'search' && (<div className={TIP}><p className={TIP_TEXT}>Search</p></div>)}
                    </div>
                  )}
                </div>
              )}
              {(showSemantics || showDownload) && (
                <div className="h-[48px] relative shrink-0 w-[1px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 48"><path d="M0.5 0V48" stroke="var(--stroke-0, #D5DCEC)" /></svg>
                </div>
              )}
              {showSemantics && (
                <div className="relative">
                  <button onClick={() => setSemanticsMode(true)} onMouseEnter={() => setHoveredButton('semantics')} onMouseLeave={() => setHoveredButton(null)} className="flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[#eef4ff]">
                    <div className="relative shrink-0 size-[20px]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30"><path d={semanticsSvgPaths.p3e65af00} fill="var(--fill-0, #0C1220)" /></svg></div>
                  </button>
                  {hoveredButton === 'semantics' && (<div className={TIP}><p className={TIP_TEXT}>Semantics</p></div>)}
                </div>
              )}
              {showDownload && (
                <div className="relative">
                  <button onClick={handleDownloadClick} onMouseEnter={() => setHoveredButton('download')} onMouseLeave={() => setHoveredButton(null)} className={`flex items-center justify-center px-[16px] py-[8px] rounded-[12px] shrink-0 size-[40px] transition-colors ${downloadMenuOpen ? 'bg-[#95afe0]' : 'bg-transparent hover:bg-[#eef4ff]'}`}>
                    <div className="overflow-clip relative shrink-0 size-[20px]"><div className="absolute inset-[5%_10%]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18"><path d={downloadSvgPaths.p3fd3bc00} fill="var(--fill-0, #0C1220)" /></svg></div></div>
                  </button>
                  {hoveredButton === 'download' && !downloadMenuOpen && (<div className={TIP}><p className={TIP_TEXT}>Download</p></div>)}
                  {downloadMenuOpen && (
                    <div className="-translate-x-1/2 absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] left-1/2 bottom-[60px] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50">
                      <div className="flex flex-col p-[4px] gap-[2px]">
                        <button onClick={() => handleDownloadOption('mesh')} disabled={downloadingOption !== null} className="flex items-center justify-between px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap gap-[24px]"><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Mesh (fbx)</span>{downloadingOption === 'mesh' && (<div className="animate-spin h-4 w-4 border-2 border-[#95afe0] border-t-transparent rounded-full" />)}</button>
                        <button onClick={() => handleDownloadOption('compressed')} disabled={downloadingOption !== null} className="flex items-center justify-between px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap gap-[24px]"><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Compressed splat (SPZ)</span>{downloadingOption === 'compressed' && (<div className="animate-spin h-4 w-4 border-2 border-[#95afe0] border-t-transparent rounded-full" />)}</button>
                        <button onClick={() => handleDownloadOption('uncompressed')} disabled={downloadingOption !== null} className="flex items-center justify-between px-[16px] py-[8px] rounded-[8px] hover:bg-[#eef4ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap gap-[24px]"><span className="font-['Figtree:SemiBold',sans-serif] font-semibold text-[14px] text-[#0c1220]">Uncompressed splat (PLY)</span>{downloadingOption === 'uncompressed' && (<div className="animate-spin h-4 w-4 border-2 border-[#95afe0] border-t-transparent rounded-full" />)}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}

    </div>
  );
}