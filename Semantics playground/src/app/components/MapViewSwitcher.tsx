import { useState } from 'react';
import { Map, Satellite, EyeOff } from 'lucide-react';
import MapHide from '../../imports/MapHide/MapHide';

export type MapViewMode = 'streets' | 'satellite' | 'hidden';

interface MapViewSwitcherProps {
  currentView: MapViewMode;
  onViewChange: (view: MapViewMode) => void;
  location?: 'controls' | 'toolbar';
}

export function MapViewSwitcher({ currentView, onViewChange, location = 'controls' }: MapViewSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const views: { mode: MapViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'streets', icon: <Map className={location === 'toolbar' ? 'size-4' : 'size-[18px]'} />, label: 'Streets' },
    { mode: 'satellite', icon: <Satellite className={location === 'toolbar' ? 'size-4' : 'size-[18px]'} />, label: 'Satellite' },
    { 
      mode: 'hidden', 
      icon: location === 'toolbar' ? (
        <div className="size-4"><MapHide /></div>
      ) : (
        <div className="size-[18px]"><MapHide /></div>
      ), 
      label: 'Hide map' 
    },
  ];

  const currentViewData = views.find(v => v.mode === currentView) || views[0];

  if (location === 'toolbar') {
    return (
      <div className="relative">
        {/* Toolbar style button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 size-[40px] transition-colors bg-transparent hover:bg-[#eef4ff]"
          title={`Map View: ${currentViewData.label}`}
        >
          <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Map View">
            <div className="absolute inset-[10%]" data-name="Icon Content">
              {currentViewData.icon}
            </div>
          </div>
        </button>

        {/* Expanded menu */}
        {isExpanded && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50 overflow-hidden">
            <div className="flex flex-col p-1 gap-1">
              {views.map((view) => (
                <button
                  key={view.mode}
                  onClick={() => {
                    onViewChange(view.mode);
                    setIsExpanded(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === view.mode
                      ? 'bg-[#95afe0] text-[#0C1220]'
                      : 'hover:bg-[#eef4ff] text-[#0C1220]'
                  }`}
                >
                  {view.icon}
                  <span className="text-sm font-medium whitespace-nowrap">{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Controls style (matches MapNavButtons)
  return (
    <div className="relative">
      {/* Control style button - matches other map control buttons */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] content-stretch flex h-[32px] w-[32px] items-center justify-center p-[7px] relative rounded-[8px] shrink-0 hover:bg-[rgba(255,255,255,0.95)] transition-colors cursor-pointer"
        title={`Map View: ${currentViewData.label}`}
      >
        <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
        <div className="overflow-clip relative shrink-0 size-[18px]">
          {currentViewData.icon}
        </div>
      </button>

      {/* Expanded menu */}
      {isExpanded && (
        <div className="absolute left-0 bottom-full mb-2 backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] rounded-[12px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] z-50 overflow-hidden">
          <div className="flex flex-col p-1 gap-1">
            {views.map((view) => (
              <button
                key={view.mode}
                onClick={() => {
                  onViewChange(view.mode);
                  setIsExpanded(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === view.mode
                    ? 'bg-[#95afe0] text-[#0C1220]'
                    : 'hover:bg-[#eef4ff] text-[#0C1220]'
                }`}
              >
                {view.icon}
                <span className="text-sm font-medium whitespace-nowrap">{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}