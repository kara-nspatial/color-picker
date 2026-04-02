import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import svgPaths from "../../imports/MapNavButtons/svg-3x5gw39bw5";

interface InteractiveMapNavButtonsProps {
  map: mapboxgl.Map | null;
}

export function InteractiveMapNavButtons({ map }: InteractiveMapNavButtonsProps) {
  const [rotation, setRotation] = useState(0);

  const handleCompassClick = () => {
    if (!map) return;
    map.easeTo({ bearing: 0, pitch: 45 });
    setRotation(0);
  };

  const handleCenterClick = () => {
    if (!map) return;
    // Center on 55-61 Jefferson St, San Francisco, CA 94133
    map.easeTo({ 
      center: [-122.4132, 37.8082],
      zoom: 18
    });
  };

  const handleZoomIn = () => {
    if (!map) return;
    map.zoomIn();
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.zoomOut();
  };

  // Update rotation when map rotates
  useEffect(() => {
    if (!map) return;
    
    const handleRotate = () => {
      setRotation(map.getBearing());
    };
    
    map.on('rotate', handleRotate);
    
    return () => {
      map.off('rotate', handleRotate);
    };
  }, [map]);

  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative" data-name="Map Nav buttons">
      {/* Compass Button */}
      <button
        onClick={handleCompassClick}
        className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] content-stretch flex h-[32px] items-center justify-center p-[7px] relative rounded-[8px] shrink-0 hover:bg-[rgba(255,255,255,0.95)] transition-colors cursor-pointer"
        data-name="Compass"
        aria-label="Reset compass"
      >
        <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
        <div 
          className="overflow-clip relative shrink-0 size-[18px] transition-transform"
          data-name="Direction=Compass - N"
          style={{ transform: `rotate(${-rotation}deg)` }}
        >
          <div className="absolute inset-[10%_27.81%_10%_27.75%]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.00018 14.4">
              <g id="Group 1">
                <path d={svgPaths.p2cae5b00} fill="var(--fill-0, #95AFE0)" id="Union" />
                <path d={svgPaths.p3b84100} fill="var(--fill-0, #0C1220)" id="Icon Content" />
              </g>
            </svg>
          </div>
        </div>
      </button>

      {/* Center on Asset Button */}
      <div className="backdrop-blur-[3px] content-stretch flex items-start relative shrink-0" data-name="Center on asset">
        <button
          onClick={handleCenterClick}
          className="bg-[rgba(255,255,255,0.8)] content-stretch flex h-[32px] items-center justify-center p-[7px] relative rounded-[8px] shrink-0 hover:bg-[rgba(255,255,255,0.95)] transition-colors cursor-pointer"
          data-name="03 Tertiary"
          aria-label="Center on asset"
        >
          <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
          <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Center - Centered">
            <div className="absolute inset-[5%]" data-name="Icon Content">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.2008 16.2">
                <g id="Icon Content">
                  <path d={svgPaths.p3ea62c00} fill="var(--fill-0, #0C1220)" />
                  <path clipRule="evenodd" d={svgPaths.pece3b80} fill="var(--fill-0, #0C1220)" fillRule="evenodd" />
                </g>
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Zoom Buttons */}
      <div className="backdrop-blur-[3px] content-stretch flex flex-col items-center relative rounded-[8px] shrink-0 w-[32px]" data-name="Zoom button">
        <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
        
        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="bg-[rgba(255,255,255,0.8)] h-[32px] relative rounded-tl-[8px] rounded-tr-[8px] shrink-0 w-full hover:bg-[rgba(255,255,255,0.95)] transition-colors cursor-pointer"
          data-name="Zoom in"
          aria-label="Zoom in"
        >
          <div className="flex flex-row items-center justify-center size-full">
            <div className="content-stretch flex items-center justify-center p-[7px] relative size-full">
              <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Plus">
                <div className="absolute inset-[5%]" data-name="Icon Content">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.2 16.2">
                    <path d={svgPaths.p2af91900} fill="var(--fill-0, #0C1220)" id="Icon Content" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="bg-[rgba(255,255,255,0.8)] h-[32px] relative rounded-bl-[8px] rounded-br-[8px] shrink-0 w-full hover:bg-[rgba(255,255,255,0.95)] transition-colors cursor-pointer"
          data-name="Zoom out"
          aria-label="Zoom out"
        >
          <div className="flex flex-row items-center justify-center size-full">
            <div className="content-stretch flex items-center justify-center p-[7px] relative size-full">
              <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Minus">
                <div className="-translate-y-1/2 absolute aspect-[12/2] left-[20%] right-[20%] top-1/2" data-name="Icon Content">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.8 1.8">
                    <path d="M0 1.8V0H10.8V1.8H0Z" fill="var(--fill-0, #0C1220)" id="Icon Content" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Border consistency overlay */}
        <div className="absolute h-[64px] left-0 rounded-[8px] top-0 w-[32px] pointer-events-none" data-name="border consistency">
          <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
        </div>

        {/* Divider line */}
        <div className="absolute h-0 left-[8px] top-[32px] w-[16px] pointer-events-none" data-name="Divider line">
          <div className="absolute inset-[-0.5px_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 1">
              <path d="M0 0.5H16" id="Divider line" stroke="var(--stroke-0, #D5DCEC)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}