import svgPaths from "./svg-u0k3vcaky9";

export default function ToolBar() {
  return (
    <div className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[8px] items-center justify-center pl-[4px] pr-[8px] py-[4px] relative rounded-[16px] size-full" data-name="Tool bar 2.0">
      <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_0px_7px_0px_rgba(0,0,0,0.25)]" />
      <div className="bg-[#d5dcec] content-stretch flex gap-[4px] items-center p-[4px] relative rounded-[12px] shrink-0" data-name="View toggles">
        <div aria-hidden="true" className="absolute border border-[#d5dcec] border-solid inset-0 pointer-events-none rounded-[12px]" />
        <div className="content-stretch flex items-start relative shrink-0" data-name="Exploro buttons">
          <div className="bg-[#95afe0] content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 size-[40px]" data-name="Dark tool bar - modes">
            <div className="overflow-clip relative shrink-0 size-[28px]" data-name="Tea-mesh original">
              <div className="absolute inset-[20.24%_4.46%_20.28%_5%]" data-name="Icon Content">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.3518 16.6537">
                  <path clipRule="evenodd" d={svgPaths.p268ac100} fill="var(--fill-0, #0C1220)" fillRule="evenodd" id="Icon Content" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start relative shrink-0" data-name="Exploro buttons">
          <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 size-[40px]" data-name="Dark tool bar - modes">
            <div className="overflow-clip relative shrink-0 size-[28px]" data-name="Tea-splat original">
              <div className="absolute inset-[20.64%_5%_20.62%_5%]" data-name="Icon Content">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.2 16.4459">
                  <path clipRule="evenodd" d={svgPaths.p3d8c0d00} fill="var(--fill-0, #0C1220)" fillRule="evenodd" id="Icon Content" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center self-stretch">
        <div className="h-full relative shrink-0 w-0" data-name="Divider Line">
          <div className="absolute inset-[0_-0.5px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 48">
              <path d="M0.5 0V48" id="Divider Line" stroke="var(--stroke-0, #D5DCEC)" />
            </svg>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[4px] items-start relative shrink-0" data-name="Tools">
        <div className="content-stretch flex items-start relative shrink-0" data-name="Exploro buttons">
          <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 size-[40px]" data-name="Button Base Component">
            <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Move - Georef">
              <div className="-translate-y-1/2 absolute aspect-[20/20] left-[5%] right-[5%] top-1/2" data-name="Icon Content">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                  <path d={svgPaths.p3cc86080} fill="var(--fill-0, #0C1220)" id="Icon Content" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start relative shrink-0" data-name="Exploro buttons">
          <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 size-[40px]" data-name="Button Base Component">
            <div className="overflow-clip relative shrink-0 size-[20px]" data-name="NOT IN USE/Sites plus">
              <div className="absolute inset-[5%_9.95%_5%_11.53%]" data-name="Icon Content">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7037 18">
                  <path d={svgPaths.pea92100} fill="var(--fill-0, #0C1220)" id="Icon Content" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[48px] relative shrink-0 w-[50px]" data-name="Actions">
        <div className="absolute inset-[0_0_0_-1%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50.5 48">
            <g id="Actions">
              <path d="M0.5 0V48" id="Divider Line" stroke="var(--stroke-0, #D5DCEC)" />
              <g id="Tools2" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}