import { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

type ViewSwitcherLocation = 'controls' | 'toolbar';

interface PrototypeMenuProps {
  onViewSwitcherLocationChange: (location: ViewSwitcherLocation) => void;
  viewSwitcherLocation: ViewSwitcherLocation;
  showSiteName: boolean;
  onShowSiteNameChange: (show: boolean) => void;
  showGeoreference: boolean;
  onShowGeoreferenceChange: (show: boolean) => void;
  showAnnotation: boolean;
  onShowAnnotationChange: (show: boolean) => void;
  showDownload: boolean;
  onShowDownloadChange: (show: boolean) => void;
  showSemantics: boolean;
  onShowSemanticsChange: (show: boolean) => void;
  showMeasure: boolean;
  onShowMeasureChange: (show: boolean) => void;
  showSearch: boolean;
  onShowSearchChange: (show: boolean) => void;
  showSelect: boolean;
  onShowSelectChange: (show: boolean) => void;
  searchMode: 'toolbar' | 'floating';
  onSearchModeChange: (mode: 'toolbar' | 'floating') => void;
}

export default function PrototypeMenu({ 
  onViewSwitcherLocationChange, 
  viewSwitcherLocation,
  showSiteName,
  onShowSiteNameChange,
  showGeoreference,
  onShowGeoreferenceChange,
  showAnnotation,
  onShowAnnotationChange,
  showDownload,
  onShowDownloadChange,
  showSemantics,
  onShowSemanticsChange,
  showMeasure,
  onShowMeasureChange,
  showSearch,
  onShowSearchChange,
  showSelect,
  onShowSelectChange,
  searchMode,
  onSearchModeChange,
}: PrototypeMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize position when panel becomes visible
  useEffect(() => {
    if (isExpanded && position.x === 0 && position.y === 0) {
      setPosition({
        x: window.innerWidth - 280,
        y: window.innerHeight - 300
      });
    }
  }, [isExpanded, position.x, position.y]);

  const clampPosition = (x: number, y: number) => {
    const w = panelRef.current?.offsetWidth  ?? 250;
    const h = panelRef.current?.offsetHeight ?? 300;
    return {
      x: Math.min(Math.max(x, 0), window.innerWidth  - w),
      y: Math.min(Math.max(y, 0), window.innerHeight - h),
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition(clampPosition(e.clientX - dragOffset.x, e.clientY - dragOffset.y));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleResize = () => setPosition(p => clampPosition(p.x, p.y));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  return (
    <>
      {isExpanded && (
        // Draggable expanded panel
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] flex flex-col rounded-[16px] border border-[#d5dcec] border-solid shadow-[0px_0px_3px_0px_rgba(0,0,0,0.15)] overflow-hidden w-[250px] z-50"
        >
          {/* Header - draggable */}
          <div
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#d5dcec] select-none"
          >
            <span className="font-medium text-[#0C1220] text-sm">Prototype Settings</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="hover:bg-[rgba(0,0,0,0.1)] p-1 rounded transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X className="size-4 text-[#0C1220]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3 space-y-3">
            {/* Show Site Name Toggle */}
            <div className="space-y-2">
              <label className="text-xs text-[#0C1220]/70 font-medium">Site panel</label>
              <button
                onClick={() => onShowSiteNameChange(!showSiteName)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-[#eef4ff] transition-colors"
              >
                <span className="text-sm text-[#0C1220]">{showSiteName ? 'Enabled' : 'Disabled'}</span>
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSiteName ? 'bg-[#95afe0]' : 'bg-[#d5dcec]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSiteName ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#0C1220]/70 font-medium">View Switcher</label>
              <div className="space-y-1">
                <button 
                  onClick={() => onViewSwitcherLocationChange('controls')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-[#0C1220] ${
                    viewSwitcherLocation === 'controls' 
                      ? 'bg-[#95afe0]' 
                      : 'hover:bg-[#eef4ff]'
                  }`}
                >
                  In map controls
                </button>
                <button 
                  onClick={() => onViewSwitcherLocationChange('toolbar')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-[#0C1220] ${
                    viewSwitcherLocation === 'toolbar' 
                      ? 'bg-[#95afe0]' 
                      : 'hover:bg-[#eef4ff]'
                  }`}
                >
                  In tool bar
                </button>
              </div>
            </div>

            {/* Toolbar Options Section */}
            <div className="space-y-2 pt-2 border-t border-[#d5dcec]">
              <label className="text-xs text-[#0C1220]/70 font-medium">Toolbar Options</label>
              
              {/* Georeference Toggle */}
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center justify-between">
                  <span className="font-['Figtree',sans-serif] text-[14px] text-[#0c1220]">Georeference</span>
                  <label className="relative inline-block w-[44px] h-[24px]">
                    <input
                      type="checkbox"
                      checked={showGeoreference}
                      onChange={(e) => onShowGeoreferenceChange(e.target.checked)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-[#d5dcec] rounded-[24px] transition-all duration-300 peer-checked:bg-[#95afe0] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[20px]"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-['Figtree',sans-serif] text-[14px] text-[#0c1220]">Annotation</span>
                  <label className="relative inline-block w-[44px] h-[24px]">
                    <input
                      type="checkbox"
                      checked={showAnnotation}
                      onChange={(e) => onShowAnnotationChange(e.target.checked)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-[#d5dcec] rounded-[24px] transition-all duration-300 peer-checked:bg-[#95afe0] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[20px]"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-['Figtree',sans-serif] text-[14px] text-[#0c1220]">Download</span>
                  <label className="relative inline-block w-[44px] h-[24px]">
                    <input
                      type="checkbox"
                      checked={showDownload}
                      onChange={(e) => onShowDownloadChange(e.target.checked)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-[#d5dcec] rounded-[24px] transition-all duration-300 peer-checked:bg-[#95afe0] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[20px]"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-['Figtree',sans-serif] text-[14px] text-[#0c1220]">Measure</span>
                  <label className="relative inline-block w-[44px] h-[24px]">
                    <input
                      type="checkbox"
                      checked={showMeasure}
                      onChange={(e) => onShowMeasureChange(e.target.checked)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-[#d5dcec] rounded-[24px] transition-all duration-300 peer-checked:bg-[#95afe0] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[20px]"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-['Figtree',sans-serif] text-[14px] text-[#0c1220]">Search</span>
                  <label className="relative inline-block w-[44px] h-[24px]">
                    <input
                      type="checkbox"
                      checked={showSearch}
                      onChange={(e) => onShowSearchChange(e.target.checked)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-[#d5dcec] rounded-[24px] transition-all duration-300 peer-checked:bg-[#95afe0] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[20px]"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-['Figtree',sans-serif] text-[14px] text-[#0c1220]">Select</span>
                  <label className="relative inline-block w-[44px] h-[24px]">
                    <input
                      type="checkbox"
                      checked={showSelect}
                      onChange={(e) => onShowSelectChange(e.target.checked)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-[#d5dcec] rounded-[24px] transition-all duration-300 peer-checked:bg-[#95afe0] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[20px]"></span>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-['Figtree',sans-serif] text-[14px] text-[#0c1220]">Semantics</span>
                  <label className="relative inline-block w-[44px] h-[24px]">
                    <input
                      type="checkbox"
                      checked={showSemantics}
                      onChange={(e) => onShowSemanticsChange(e.target.checked)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-[#d5dcec] rounded-[24px] transition-all duration-300 peer-checked:bg-[#95afe0] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[20px]"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="space-y-2 pt-2 border-t border-[#d5dcec]">
              <label className="text-xs text-[#0C1220]/70 font-medium">Search</label>
              <div className="space-y-1">
                <button
                  onClick={() => onSearchModeChange('toolbar')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-[#0C1220] ${
                    searchMode === 'toolbar' ? 'bg-[#95afe0]' : 'hover:bg-[#eef4ff]'
                  }`}
                >
                  Toolbar locked
                </button>
                <button
                  onClick={() => onSearchModeChange('floating')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-[#0C1220] ${
                    searchMode === 'floating' ? 'bg-[#95afe0]' : 'hover:bg-[#eef4ff]'
                  }`}
                >
                  Floating panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings button - always visible in bottom right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] p-2 rounded-full border border-[#d5dcec] border-solid shadow-[0px_0px_3px_0px_rgba(0,0,0,0.15)] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
          title="Prototype Settings"
        >
          <Settings className="size-5 text-[#0C1220]" />
        </button>
      </div>
    </>
  );
}