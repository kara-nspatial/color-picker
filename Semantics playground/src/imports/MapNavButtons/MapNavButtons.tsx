import svgPaths from "./svg-3x5gw39bw5";

export default function MapNavButtons() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative size-full" data-name="Map Nav buttons">
      <div className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] content-stretch flex h-[32px] items-center justify-center p-[7px] relative rounded-[8px] shrink-0" data-name="Compass">
        <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
        <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Direction=Compass - N">
          <div className="absolute inset-[10%_27.81%_10%_27.75%]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.00018 14.4">
              <g id="Group 1">
                <path d={svgPaths.p2cae5b00} fill="var(--fill-0, #95AFE0)" id="Union" />
                <path d={svgPaths.p3b84100} fill="var(--fill-0, #0C1220)" id="Icon Content" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <div className="backdrop-blur-[3px] content-stretch flex items-start relative shrink-0" data-name="Center on asset">
        <div className="bg-[rgba(255,255,255,0.8)] content-stretch flex h-[32px] items-center justify-center p-[7px] relative rounded-[8px] shrink-0" data-name="03 Tertiary">
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
        </div>
        <div className="absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[8px] items-center justify-center left-[-126px] opacity-0 px-[16px] py-[8px] rounded-[16px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] top-[-1px]" data-name="Tool Tips">
          <div className="flex flex-col font-['Figtree:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#0c1220] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[20px]">Center on asset</p>
          </div>
        </div>
      </div>
      <div className="backdrop-blur-[3px] content-stretch flex flex-col items-center relative rounded-[8px] shrink-0 w-[32px]" data-name="Zoom button">
        <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
        <div className="bg-[rgba(255,255,255,0.8)] h-[32px] relative rounded-tl-[8px] rounded-tr-[8px] shrink-0 w-full" data-name="Zoom in">
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
        </div>
        <div className="bg-[rgba(255,255,255,0.8)] h-[32px] relative rounded-bl-[8px] rounded-br-[8px] shrink-0 w-full" data-name="Zoom out">
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
        </div>
        <div className="absolute h-[64px] left-0 rounded-[8px] top-0 w-[32px]" data-name="border consistency">
          <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
        </div>
        <div className="absolute backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[8px] items-center justify-center left-[-63px] opacity-0 px-[16px] py-[8px] rounded-[16px] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] top-[14px]" data-name="Tool Tips">
          <div className="flex flex-col font-['Figtree:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#0c1220] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[20px]">Zoom</p>
          </div>
        </div>
        <div className="absolute h-0 left-[8px] top-[32px] w-[16px]" data-name="Divider line">
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