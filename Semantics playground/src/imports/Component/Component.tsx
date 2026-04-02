import svgPaths from "./svg-4pzlloiclw";

export default function Component() {
  return (
    <div className="relative size-full" data-name="Component">
      <div className="absolute inset-[5%]" data-name="Icon Content">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <path d={svgPaths.p16b4a380} fill="var(--fill-0, #2D2D2D)" id="Icon Content" />
        </svg>
      </div>
    </div>
  );
}