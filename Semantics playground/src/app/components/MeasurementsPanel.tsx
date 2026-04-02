import { useRef, useState } from 'react';
import { X, Eye, Trash2, Ruler, Box, Layers } from 'lucide-react';

export type MeasureType = 'distance' | 'volume' | 'surface-area';
export type Units = 'metric' | 'imperial';

export interface Measurement {
  id: number;
  name: string;
  distanceM: number;
  type: MeasureType;
}

export function formatDistance(m: number, units: Units): string {
  if (units === 'metric') {
    return m >= 1 ? `${m.toFixed(2)} m` : `${(m * 100).toFixed(1)} cm`;
  }
  const ft = m * 3.28084;
  return ft >= 1 ? `${ft.toFixed(2)} ft` : `${(ft * 12).toFixed(1)} in`;
}

const TYPE_ICON: Record<MeasureType, JSX.Element> = {
  'distance':     <Ruler   className="size-3.5 text-[#f97316]" strokeWidth={2} />,
  'volume':       <Box     className="size-3.5 text-[#2d5290]" strokeWidth={2} />,
  'surface-area': <Layers  className="size-3.5 text-[#2a9e5c]" strokeWidth={2} />,
};

interface MeasurementsPanelProps {
  measurements: Measurement[];
  units: Units;
  onUnitsChange: (u: Units) => void;
  onClose: () => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onRename: (id: number, newName: string) => void;
  alwaysVisible?: boolean;
  onAlwaysVisibleChange?: (v: boolean) => void;
}

export default function MeasurementsPanel({
  measurements,
  units,
  onUnitsChange,
  onClose,
  onDelete,
  onView,
  onRename,
  alwaysVisible = false,
  onAlwaysVisibleChange,
}: MeasurementsPanelProps) {
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editValue, setEditValue]   = useState('');
  const inputRef                    = useRef<HTMLInputElement>(null);

  const startEdit = (m: Measurement) => {
    setEditingId(m.id);
    setEditValue(m.name);
    // auto-focus in next tick
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    if (editingId !== null) {
      onRename(editingId, editValue.trim() || `Measurement`);
      setEditingId(null);
    }
  };

  return (
    <div
      className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.92)] rounded-[16px] border border-[#d5dcec] shadow-[0px_0px_12px_0px_rgba(45,82,144,0.18)] w-[300px]"
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#d5dcec]">
        <span className="text-[#0C1220]" style={{ fontSize: '15px', fontWeight: 600 }}>
          Measurements
        </span>
        {/* Close */}
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#eef4ff] transition-colors">
          <X className="size-4 text-[#5a6a84]" />
        </button>
      </div>

      {/* Settings row: units + always-visible toggle */}
      <div className="px-4 py-3 border-b border-[#d5dcec] flex flex-col gap-3">

        {/* Units */}
        <div className="flex items-center justify-between">
          <span className="text-[#0C1220]" style={{ fontSize: '13px', fontWeight: 600 }}>Units</span>
          <div className="flex items-center bg-[#eef4ff] rounded-[8px] p-[2px]">
            {(['metric', 'imperial'] as Units[]).map(u => (
              <button
                key={u}
                onClick={() => onUnitsChange(u)}
                className="px-2 py-0.5 rounded-[6px] transition-colors"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  background: units === u ? '#fff' : 'transparent',
                  color: units === u ? '#0C1220' : '#5a6a84',
                  boxShadow: units === u ? '0 1px 3px rgba(45,82,144,0.12)' : 'none',
                }}
              >
                {u === 'metric' ? 'm' : 'ft'}
              </button>
            ))}
          </div>
        </div>

        {/* Persist-in-scene toggle */}
        {onAlwaysVisibleChange && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#0C1220]" style={{ fontSize: '13px', fontWeight: 600 }}>
                Show while using other tools
              </span>
              <span className="text-[#8896b0]" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                Measurements stay anchored in the scene
              </span>
            </div>
            {/* iOS-style toggle */}
            <button
              onClick={() => onAlwaysVisibleChange(!alwaysVisible)}
              className="relative shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
              style={{
                width: 36,
                height: 20,
                background: alwaysVisible ? '#2d5290' : '#d5dcec',
              }}
              aria-pressed={alwaysVisible}
            >
              <span
                className="absolute top-[2px] rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{
                  width: 16,
                  height: 16,
                  left: 2,
                  transform: alwaysVisible ? 'translateX(16px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-2 py-2 flex flex-col gap-1 max-h-[340px] overflow-y-auto">
        {measurements.length === 0 ? (
          <p className="text-center py-4 text-[#5a6a84]" style={{ fontSize: '13px' }}>
            No measurements yet
          </p>
        ) : (
          measurements.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] hover:bg-[#f4f7fd] transition-colors group"
            >
              {/* Type icon */}
              <div className="shrink-0 size-6 flex items-center justify-center rounded-[6px] bg-[#f0f3fa]">
                {TYPE_ICON[m.type]}
              </div>

              {/* Name + distance */}
              <div className="flex-1 min-w-0">
                {editingId === m.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    autoFocus
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full bg-white border border-[#95afe0] rounded-[6px] px-1.5 py-0.5 outline-none text-[#0C1220]"
                    style={{ fontSize: '13px', fontWeight: 600 }}
                  />
                ) : (
                  <p
                    className="text-[#0C1220] truncate cursor-pointer hover:text-[#2d5290] transition-colors"
                    style={{ fontSize: '13px', fontWeight: 600 }}
                    onClick={() => startEdit(m)}
                    title="Click to rename"
                  >
                    {m.name}
                  </p>
                )}
                <p className="text-[#5a6a84] mt-0.5" style={{ fontSize: '12px' }}>
                  {formatDistance(m.distanceM, units)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onView(m.id)}
                  className="p-1.5 rounded-[7px] hover:bg-[#dce8ff] transition-colors"
                  title="Zoom to measurement"
                >
                  <Eye className="size-3.5 text-[#2d5290]" />
                </button>
                <button
                  onClick={() => onDelete(m.id)}
                  className="p-1.5 rounded-[7px] hover:bg-[#fee2e2] transition-colors"
                  title="Delete measurement"
                >
                  <Trash2 className="size-3.5 text-[#e05252]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}