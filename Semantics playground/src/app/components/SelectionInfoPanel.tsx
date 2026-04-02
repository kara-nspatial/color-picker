import { X, ScanSearch, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SelectionInfo {
  name: string;
  type: string;
}

interface SelectionInfoPanelProps {
  selection: SelectionInfo | null;
  onClose: () => void;
  onFindAllInScene?: () => void;
  foundCount?: number | null;
  onClearFound?: () => void;
}

export default function SelectionInfoPanel({
  selection,
  onClose,
  onFindAllInScene,
  foundCount,
  onClearFound,
}: SelectionInfoPanelProps) {
  if (!selection) return null;

  const isFoundMode = foundCount != null;

  return (
    <div
      className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.92)] rounded-[16px] border border-[#d5dcec] shadow-[0px_0px_12px_0px_rgba(45,82,144,0.18)] w-[280px] overflow-hidden"
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isFoundMode ? (
          /* ── "All found" state ─────────────────────────────────────── */
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {/* Blue accent header */}
            <div className="bg-[#2d5290] px-4 pt-3.5 pb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-[32px] rounded-[9px] bg-white/15 shrink-0">
                  <span
                    className="text-white"
                    style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1 }}
                  >
                    {foundCount}
                  </span>
                </div>
                <div>
                  <p className="text-white leading-tight" style={{ fontSize: '14px', fontWeight: 700 }}>
                    objects found in scene
                  </p>
                  <p className="text-white/70 mt-0.5" style={{ fontSize: '12px' }}>
                    {selection.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X className="size-4 text-white/80" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              <p className="text-[#5a6a84] leading-snug" style={{ fontSize: '12px' }}>
                {selection.type}
              </p>
              <button
                onClick={onClearFound}
                className="mt-3 flex items-center gap-1.5 text-[#2d5290] hover:text-[#1a3d73] transition-colors"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                <ArrowLeft className="size-[14px]" strokeWidth={2.5} />
                Back to selection
              </button>
            </div>
          </motion.div>

        ) : (
          /* ── Normal single-selection state ─────────────────────────── */
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <div className="px-4 pt-4 pb-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[#0C1220] leading-snug" style={{ fontSize: '15px', fontWeight: 600 }}>
                  {selection.name}
                </p>
                <p className="text-[#5a6a84] mt-1 leading-snug" style={{ fontSize: '13px' }}>
                  {selection.type}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 mt-0.5 p-1 rounded-lg hover:bg-[#eef4ff] transition-colors"
                title="Close"
              >
                <X className="size-4 text-[#5a6a84]" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e8edf6] mx-4" />

            {/* Find all button */}
            <div className="px-4 py-3">
              <button
                onClick={onFindAllInScene}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#eef4ff] hover:bg-[#dce8fc] border border-[#c5d4f0] transition-colors"
                style={{ fontSize: '13px', fontWeight: 600, color: '#2d5290' }}
              >
                <ScanSearch className="size-[15px] shrink-0" strokeWidth={2} />
                Find all in scene
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
