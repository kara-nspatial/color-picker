import { X, SquareDashed, Monitor, MoveHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type BoundaryItem = { id: number; kind: string; name: string };

interface BoundaryResultsPanelProps {
  items: BoundaryItem[] | null;
  onClose: () => void;
}

type KindMeta = { label: string; model: string; color: string; bg: string; icon: React.ReactNode };

const KIND_META: Record<string, KindMeta> = {
  chair: {
    label:  'Chairs',
    model:  'Herman Miller Aeron',
    color:  '#2d5290',
    bg:     '#eef4ff',
    icon:   <svg viewBox="0 0 20 20" fill="none" className="size-[14px]" aria-hidden="true">
              <rect x="4" y="7" width="12" height="7" rx="2" fill="currentColor" opacity=".9"/>
              <rect x="7" y="14" width="2" height="4" rx="1" fill="currentColor" opacity=".7"/>
              <rect x="11" y="14" width="2" height="4" rx="1" fill="currentColor" opacity=".7"/>
              <rect x="3" y="5" width="14" height="3" rx="1.5" fill="currentColor"/>
            </svg>,
  },
  desk: {
    label:  'Desks',
    model:  'Jarvis Bamboo Standing Desk',
    color:  '#6d4c2a',
    bg:     '#fdf4e7',
    icon:   <svg viewBox="0 0 20 20" fill="none" className="size-[14px]" aria-hidden="true">
              <rect x="2" y="8" width="16" height="3" rx="1.5" fill="currentColor"/>
              <rect x="4" y="11" width="2" height="7" rx="1" fill="currentColor" opacity=".7"/>
              <rect x="14" y="11" width="2" height="7" rx="1" fill="currentColor" opacity=".7"/>
            </svg>,
  },
  monitor: {
    label:  'Monitors',
    model:  'Dell UltraSharp 27" 4K',
    color:  '#1a5c3a',
    bg:     '#eafaf1',
    icon:   <Monitor className="size-[14px]" strokeWidth={2} />,
  },
};

// Order to display kinds in
const KIND_ORDER = ['chair', 'desk', 'monitor'];

export default function BoundaryResultsPanel({ items, onClose }: BoundaryResultsPanelProps) {
  if (!items) return null;

  const total = items.length;

  // Group by kind
  const byKind: Record<string, number> = {};
  for (const item of items) {
    byKind[item.kind] = (byKind[item.kind] ?? 0) + 1;
  }
  const presentKinds = KIND_ORDER.filter(k => byKind[k]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.95)] rounded-[16px] border border-[#1a6fff] shadow-[0px_0px_16px_0px_rgba(26,111,255,0.18)] w-[268px] overflow-hidden"
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-[#1a6fff] px-4 pt-3.5 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-[32px] rounded-[9px] bg-white/15 shrink-0">
            <SquareDashed className="size-[16px] text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-white leading-tight" style={{ fontSize: '14px', fontWeight: 700 }}>
              Area Selection
            </p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: '12px' }}>
              {total === 0
                ? 'Nothing found in region'
                : `${total} object${total !== 1 ? 's' : ''} in region`}
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

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="px-3 py-3 flex flex-col gap-2">
        {total === 0 ? (
          <div className="py-3 text-center">
            <p className="text-[#8896b0]" style={{ fontSize: '13px' }}>
              No tracked objects found.
            </p>
            <p className="text-[#aab4c8] mt-1 leading-snug" style={{ fontSize: '12px' }}>
              Try drawing a larger region.
            </p>
          </div>
        ) : (
          <>
            {presentKinds.map(kind => {
              const meta = KIND_META[kind] ?? { label: kind, model: '', color: '#2d5290', bg: '#eef4ff', icon: null };
              const count = byKind[kind];
              return (
                <div
                  key={kind}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px]"
                  style={{ background: meta.bg }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center size-[32px] rounded-[8px] shrink-0"
                    style={{ color: meta.color, background: `${meta.color}18` }}
                  >
                    {meta.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="leading-tight truncate" style={{ fontSize: '13px', fontWeight: 700, color: meta.color }}>
                      {meta.label}
                    </p>
                    <p className="truncate mt-0.5" style={{ fontSize: '11px', color: `${meta.color}bb` }}>
                      {meta.model}
                    </p>
                  </div>

                  {/* Count badge */}
                  <div
                    className="shrink-0 flex items-center justify-center h-[26px] min-w-[26px] px-2 rounded-full"
                    style={{ background: meta.color, color: 'white', fontSize: '13px', fontWeight: 700 }}
                  >
                    {count}
                  </div>
                </div>
              );
            })}

            {/* Hint to draw again */}
            <p className="text-center text-[#aab4c8] pt-1 pb-0.5" style={{ fontSize: '11px' }}>
              Draw again to update the selection
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
