import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SiteNamePanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="backdrop-blur-[3px] bg-[rgba(255,255,255,0.8)] flex flex-col rounded-[16px] border border-[#d5dcec] border-solid shadow-[0px_0px_3px_0px_rgba(0,0,0,0.15)] overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[rgba(0,0,0,0.05)] transition-colors"
      >
        <span className="font-medium text-[#0C1220]">Downtown Office</span>
        {isExpanded ? (
          <ChevronUp className="size-5 text-[#0C1220]" />
        ) : (
          <ChevronDown className="size-5 text-[#0C1220]" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#d5dcec]">
          <div className="space-y-2">
            <p className="text-xs text-[#0C1220]/50">55-61 Jefferson St, San Francisco, CA 94133</p>
          </div>
        </div>
      )}
    </div>
  );
}