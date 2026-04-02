import { useRef, useState } from 'react';
import { X, Camera, Upload, Search, CheckCircle } from 'lucide-react';

interface VisualSearchPanelProps {
  onClose: () => void;
  onHighlight?: () => void;
}

type SearchStatus = 'idle' | 'searching' | 'found';

export default function VisualSearchPanel({ onClose, onHighlight }: VisualSearchPanelProps) {
  const [dragOver, setDragOver]   = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);
  const [status, setStatus]       = useState<SearchStatus>('idle');
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStatus('searching');
    setTimeout(() => setStatus('found'), 2200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setPreview(null);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.92)] rounded-[16px] border border-[#d5dcec] shadow-[0px_0px_12px_0px_rgba(45,82,144,0.18)] w-[300px]"
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#d5dcec]">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-[#2d5290]" />
          <span className="text-[#0C1220]" style={{ fontSize: '15px', fontWeight: 600 }}>
            Find by photo
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#eef4ff] transition-colors"
        >
          <X className="size-4 text-[#5a6a84]" />
        </button>
      </div>

      <div className="p-4">
        {/* ── Idle: drop zone ───────────────────────────────────── */}
        {status === 'idle' && (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2.5 py-7 px-4 rounded-[12px] border-2 border-dashed cursor-pointer transition-colors ${
                dragOver
                  ? 'border-[#2d5290] bg-[#eef4ff]'
                  : 'border-[#d5dcec] hover:border-[#95afe0] hover:bg-[#f8faff]'
              }`}
            >
              <div className="size-10 rounded-full bg-[#eef4ff] flex items-center justify-center">
                <Upload className="size-5 text-[#2d5290]" />
              </div>
              <div className="text-center">
                <p className="text-[#0C1220]" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Drop a photo here
                </p>
                <p className="text-[#5a6a84] mt-0.5" style={{ fontSize: '12px' }}>
                  or click to browse files
                </p>
              </div>
              <p className="text-[#8896b0]" style={{ fontSize: '11px' }}>
                JPG, PNG, WEBP
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}

        {/* ── Searching ─────────────────────────────────────────── */}
        {status === 'searching' && preview && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full h-[120px] rounded-[10px] overflow-hidden bg-[#f0f3fa]">
              <img src={preview} alt="uploaded" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[rgba(255,255,255,0.55)] backdrop-blur-[2px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Search className="size-5 text-[#2d5290] animate-pulse" />
                  <p className="text-[#2d5290]" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Searching model…
                  </p>
                </div>
              </div>
            </div>
            {/* Animated scan bar */}
            <div className="w-full h-1.5 rounded-full bg-[#e8edf6] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2d5290]"
                style={{
                  width: '60%',
                  animation: 'scanBar 1.8s ease-in-out infinite',
                }}
              />
            </div>
            <style>{`
              @keyframes scanBar {
                0%   { width: 0%;   margin-left: 0; }
                50%  { width: 70%;  margin-left: 15%; }
                100% { width: 0%;   margin-left: 100%; }
              }
            `}</style>
          </div>
        )}

        {/* ── Found ─────────────────────────────────────────────── */}
        {status === 'found' && preview && (
          <div className="flex flex-col gap-3">
            {/* Thumbnail */}
            <div className="relative w-full h-[100px] rounded-[10px] overflow-hidden bg-[#f0f3fa]">
              <img src={preview} alt="uploaded" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-[rgba(255,255,255,0.92)] rounded-full px-2 py-0.5 flex items-center gap-1">
                <CheckCircle className="size-3 text-[#2a9e5c]" />
                <span className="text-[#2a9e5c]" style={{ fontSize: '11px', fontWeight: 600 }}>
                  Match found
                </span>
              </div>
            </div>

            {/* Result card */}
            <div className="bg-[#f4f7fd] rounded-[10px] px-3 py-2.5 flex flex-col gap-1.5">
              <p className="text-[#0C1220]" style={{ fontSize: '13px', fontWeight: 600 }}>
                Herman Miller Aeron Chair
              </p>
              <p className="text-[#5a6a84]" style={{ fontSize: '12px' }}>
                V2 Remastered · Adjustable Arms
              </p>
              {/* Confidence bar */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1.5 rounded-full bg-[#d5dcec] overflow-hidden">
                  <div className="h-full rounded-full bg-[#2a9e5c]" style={{ width: '94%' }} />
                </div>
                <span className="text-[#2a9e5c] shrink-0" style={{ fontSize: '11px', fontWeight: 600 }}>
                  94%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { onHighlight?.(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-[#2d5290] hover:bg-[#1e3d6e] transition-colors"
              >
                <Search className="size-3.5 text-white" />
                <span className="text-white" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Highlight in model
                </span>
              </button>
              <button
                onClick={reset}
                className="px-3 py-2 rounded-[8px] border border-[#d5dcec] hover:bg-[#eef4ff] transition-colors"
                style={{ fontSize: '12px', fontWeight: 600, color: '#5a6a84' }}
              >
                New search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
