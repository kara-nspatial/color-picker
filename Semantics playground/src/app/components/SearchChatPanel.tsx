import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, CheckCircle, Sparkles, RotateCcw, ImageIcon } from 'lucide-react';

type TextState  = 'idle' | 'thinking' | 'found';
type ImageState = 'idle' | 'searching' | 'found';

interface SearchChatPanelProps {
  onClose: () => void;
  onHighlight?: () => void;
  mode?: 'toolbar' | 'floating';
}

const AI_GREETING = 'Ask me to find something — like "find a chair" or "find Matt\'s desk" — or upload a photo to search visually.';

// Dots typing indicator
function TypingDots() {
  return (
    <div className="flex items-center gap-[5px] px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="size-[6px] rounded-full bg-[#6b87be]"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// Small AI avatar badge
function AiAvatar() {
  return (
    <div className="shrink-0 size-7 rounded-full bg-gradient-to-br from-[#2d5290] to-[#3b82f6] flex items-center justify-center shadow-sm">
      <Sparkles className="size-3.5 text-white" />
    </div>
  );
}

export function SearchChatPanel({ onClose, onHighlight, mode = 'floating' }: SearchChatPanelProps) {
  // ── Greeting (no animation) ──────────────────────────────────────────────
  const typedText = AI_GREETING;

  // ── Text search ──────────────────────────────────────────────────────────
  const [textQuery, setTextQuery]       = useState('');
  const [textState, setTextState]       = useState<TextState>('idle');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submitText = () => {
    if (!textQuery.trim()) return;
    setSubmittedQuery(textQuery.trim());
    setTextState('thinking');
    setTimeout(() => setTextState('found'), 1900);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitText();
  };

  const resetText = () => {
    setTextQuery('');
    setSubmittedQuery('');
    setTextState('idle');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Image search ─────────────────────────────────────────────────────────
  const [imageState, setImageState]     = useState<ImageState>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImagePreview(URL.createObjectURL(file));
    setImageState('searching');
    setTimeout(() => setImageState('found'), 2400);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processImage(f);
  };

  const resetImage = () => {
    setImagePreview(null);
    setImageState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetAll = () => {
    resetText();
    resetImage();
  };

  // ── Drag (floating mode only) ─────────────────────────────────────────────
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const positionInitialized = useRef(false);

  useEffect(() => {
    if (mode === 'floating' && !positionInitialized.current) {
      positionInitialized.current = true;
      // Position above the toolbar (toolbar is bottom-6 ~24px + ~56px tall)
      setPosition({
        x: window.innerWidth / 2 - 190,
        y: window.innerHeight - 24 - 56 - 12 - 420, // 420 ≈ panel height
      });
    }
  }, [mode]);

  const clampPosition = (x: number, y: number) => {
    const w = panelRef.current?.offsetWidth  ?? 380;
    const h = panelRef.current?.offsetHeight ?? 420;
    return {
      x: Math.min(Math.max(x, 0), window.innerWidth  - w),
      y: Math.min(Math.max(y, 0), window.innerHeight - h),
    };
  };

  useEffect(() => {
    if (mode !== 'floating' || !isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition(clampPosition(e.clientX - dragOffset.x, e.clientY - dragOffset.y));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, mode]);

  useEffect(() => {
    if (mode !== 'floating') return;
    const handleResize = () => setPosition(p => clampPosition(p.x, p.y));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  // ── Toolbar mode ──────────────────────────────────────────────────────────
  if (mode === 'toolbar') {
    const hasResult = textState === 'thinking' || textState === 'found' || imageState === 'searching' || imageState === 'found';
    const isActive = textState !== 'idle';

    return (
      <div className="w-full flex flex-col gap-1.5" style={{ fontFamily: 'Figtree, sans-serif' }}>
        {/* Input row */}
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-[12px]"
          style={{
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid #d5dcec',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            boxShadow: '0px 1px 6px 0px rgba(45,82,144,0.10)',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Camera / image button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`shrink-0 flex items-center justify-center size-6 rounded-[7px] transition-colors ${
              dragOver ? 'bg-[#eef4ff]' : 'hover:bg-[#eef4ff]'
            }`}
          >
            <ImageIcon className="size-3.5 text-[#2d5290]" />
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me to find something…"
            disabled={textState !== 'idle'}
            className="flex-1 bg-transparent outline-none text-[#0c1220] placeholder-[#98a8c0] disabled:opacity-50"
            style={{ fontSize: '13px' }}
          />

          {/* Send / reset button */}
          {isActive ? (
            <button
              onClick={resetAll}
              className="shrink-0 flex items-center justify-center size-6 rounded-[7px] hover:bg-[#eef4ff] transition-colors"
            >
              <RotateCcw className="size-3.5 text-[#5a6a84]" />
            </button>
          ) : (
            <button
              onClick={submitText}
              disabled={!textQuery.trim()}
              className={`shrink-0 flex items-center justify-center size-6 rounded-[7px] transition-colors ${
                textQuery.trim()
                  ? 'bg-[#2d5290] hover:bg-[#1e3d6e]'
                  : 'bg-[#c8d4ec] cursor-not-allowed'
              }`}
            >
              <Send className="size-3 text-white" />
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processImage(f); }}
          />
        </motion.div>

        {/* Compact results card */}
        <AnimatePresence>
          {hasResult && (
            <motion.div
              key="toolbar-result"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="flex items-center gap-2 px-3 py-2 rounded-[12px]"
              style={{
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid #d5dcec',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                boxShadow: '0px 1px 6px 0px rgba(45,82,144,0.10)',
              }}
            >
              {(textState === 'thinking' || imageState === 'searching') ? (
                <>
                  <AiAvatar />
                  <TypingDots />
                </>
              ) : (
                <>
                  <CheckCircle className="size-3.5 shrink-0 text-[#2a9e5c]" />
                  <span className="text-[#0c1220] flex-1 min-w-0 truncate" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Herman Miller Aeron Chair <span style={{ color: '#5a6a84', fontWeight: 500 }}>×6</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-[48px] h-1.5 rounded-full bg-[#dde5f5] overflow-hidden">
                      <div className="h-full rounded-full bg-[#2a9e5c]" style={{ width: '91%' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#2a9e5c' }}>91%</span>
                  </div>
                  <button
                    onClick={() => onHighlight?.()}
                    className="shrink-0 flex items-center justify-center px-2.5 h-6 rounded-[7px] bg-[#2d5290] hover:bg-[#1e3d6e] transition-colors"
                  >
                    <span className="text-white" style={{ fontSize: '11px', fontWeight: 600 }}>Highlight</span>
                  </button>
                  <button
                    onClick={resetAll}
                    className="shrink-0 flex items-center justify-center size-6 rounded-[7px] hover:bg-[#eef4ff] transition-colors"
                    style={{ border: '1px solid #d5dcec' }}
                  >
                    <RotateCcw className="size-3 text-[#5a6a84]" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Floating mode ─────────────────────────────────────────────────────────
  return createPortal(
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-[380px] rounded-[18px] overflow-hidden"
      style={{
        fontFamily: 'Figtree, sans-serif',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid #d5dcec',
        boxShadow: '0px 4px 28px 0px rgba(45,82,144,0.18)',
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-[#e8edf8] select-none"
        style={{ cursor: 'grab' }}
      >
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md bg-[#2d5290] flex items-center justify-center">
            <Sparkles className="size-3 text-white" />
          </div>
          <span className="text-[#0c1220]" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            AI Search
          </span>
        </div>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="size-7 flex items-center justify-center rounded-lg hover:bg-[#eef4ff] transition-colors"
        >
          <X className="size-4 text-[#5a6a84]" />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2">

        {/* ── AI Greeting bubble ─────────────────────────────────────── */}
        <div className="flex items-start gap-2.5">
          <AiAvatar />
          <div
            className="flex-1 px-3.5 py-2.5 rounded-[14px] rounded-tl-[4px]"
            style={{ background: '#f0f4fb', border: '1px solid #e2e8f4' }}
          >
            <p className="text-[#1a2f5a]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
              {typedText}
            </p>
          </div>
        </div>

        {/* ── Text-search result bubble ───────────────────────────────── */}
        <AnimatePresence>
          {textState === 'thinking' && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5"
            >
              <AiAvatar />
              <div
                className="px-3.5 py-2.5 rounded-[14px] rounded-tl-[4px]"
                style={{ background: '#f0f4fb', border: '1px solid #e2e8f4' }}
              >
                <TypingDots />
              </div>
            </motion.div>
          )}

          {textState === 'found' && (
            <motion.div
              key="text-result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5"
            >
              <AiAvatar />
              <div className="flex-1 flex flex-col gap-2">
                {/* AI reply text */}
                <div
                  className="px-3.5 py-2.5 rounded-[14px] rounded-tl-[4px]"
                  style={{ background: '#f0f4fb', border: '1px solid #e2e8f4' }}
                >
                  <p className="text-[#1a2f5a]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    I found <span style={{ fontWeight: 700 }}>6 matching objects</span> in the scene for
                    &nbsp;<em style={{ fontStyle: 'normal', color: '#2d5290', fontWeight: 600 }}>"{submittedQuery}"</em>.
                  </p>
                </div>

                {/* Result card */}
                <div
                  className="rounded-[12px] p-3 flex flex-col gap-2"
                  style={{ background: '#f8faff', border: '1px solid #dde5f5' }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-3.5 shrink-0 text-[#2a9e5c]" />
                    <span className="text-[#0c1220]" style={{ fontSize: '13px', fontWeight: 700 }}>
                      Herman Miller Aeron Chair <span style={{ color: '#5a6a84', fontWeight: 500 }}>×6</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#dde5f5] overflow-hidden">
                      <div className="h-full rounded-full bg-[#2a9e5c]" style={{ width: '91%' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#2a9e5c' }}>91%</span>
                  </div>
                  <div className="flex gap-2 mt-0.5">
                    <button
                      onClick={() => onHighlight?.()}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[9px] bg-[#2d5290] hover:bg-[#1e3d6e] transition-colors"
                    >
                      <span className="text-white" style={{ fontSize: '12px', fontWeight: 600 }}>Highlight in model</span>
                    </button>
                    <button
                      onClick={resetText}
                      className="px-3 h-8 rounded-[9px] hover:bg-[#eef4ff] transition-colors"
                      style={{ fontSize: '12px', fontWeight: 600, color: '#5a6a84', border: '1px solid #d5dcec' }}
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Text input row ──────────────────────────────────────────── */}
        {textState === 'idle' && (
          <div
            className="flex items-center gap-2 px-3 rounded-[12px] h-10"
            style={{ background: '#f4f7fd', border: '1px solid #dde5f5' }}
          >
            <input
              ref={inputRef}
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search for chairs, doors, windows…"
              className="flex-1 bg-transparent outline-none text-[#0c1220] placeholder-[#98a8c0]"
              style={{ fontSize: '13px' }}
            />
            <button
              onClick={submitText}
              disabled={!textQuery.trim()}
              className={`size-7 flex items-center justify-center rounded-[8px] shrink-0 transition-colors ${
                textQuery.trim()
                  ? 'bg-[#2d5290] hover:bg-[#1e3d6e]'
                  : 'bg-[#c8d4ec] cursor-not-allowed'
              }`}
            >
              <Send className="size-3.5 text-white" />
            </button>
          </div>
        )}

        {/* ── Image upload / search / found ───────────────────────────── */}

        {imageState === 'idle' && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex items-center justify-center gap-2 h-9 px-4 rounded-full border transition-all w-full ${
                dragOver
                  ? 'border-[#2d5290] bg-[#eef4ff]'
                  : 'border-[#d5dcec] hover:border-[#95afe0] hover:bg-[#f8faff]'
              }`}
            >
              <ImageIcon className="size-3.5 text-[#2d5290]" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#2d5290' }}>
                Search by photo upload
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processImage(f); }}
            />
          </>
        )}

        {imageState === 'searching' && imagePreview && (
          <div className="flex flex-col gap-2.5">
            {/* Image preview with scan overlay */}
            <div className="relative w-full h-[110px] rounded-[12px] overflow-hidden bg-[#e8edf8]">
              <img src={imagePreview} alt="reference" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)' }}
              >
                <AiAvatar />
                <p className="text-[#2d5290]" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Scanning model…
                </p>
              </div>
              {/* Animated scan line */}
              <motion.div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-[#e4eaf5] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#2d5290]"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '50%' }}
              />
            </div>
          </div>
        )}

        {imageState === 'found' && imagePreview && (
          <div className="flex flex-col gap-2">
            {/* Thumbnail + badge */}
            <div className="relative w-full h-[90px] rounded-[12px] overflow-hidden bg-[#e8edf8]">
              <img src={imagePreview} alt="reference" className="w-full h-full object-cover" />
              <div
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.94)', border: '1px solid #c6e9d6' }}
              >
                <CheckCircle className="size-3 text-[#2a9e5c]" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2a9e5c' }}>6 matches</span>
              </div>
            </div>

            {/* Result card */}
            <div
              className="rounded-[12px] p-3 flex flex-col gap-2"
              style={{ background: '#f8faff', border: '1px solid #dde5f5' }}
            >
              <div className="flex items-start gap-2">
                <div>
                  <p className="text-[#0c1220]" style={{ fontSize: '13px', fontWeight: 700 }}>
                    Herman Miller Aeron Chair
                  </p>
                  <p className="text-[#6b7fa0] mt-0.5" style={{ fontSize: '12px' }}>
                    6 instances found in scene
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#dde5f5] overflow-hidden">
                  <div className="h-full rounded-full bg-[#2a9e5c]" style={{ width: '94%' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2a9e5c' }}>94%</span>
              </div>

              <div className="flex gap-2 mt-0.5">
                <button
                  onClick={() => onHighlight?.()}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[9px] bg-[#2d5290] hover:bg-[#1e3d6e] transition-colors"
                >
                  <span className="text-white" style={{ fontSize: '12px', fontWeight: 600 }}>Highlight in model</span>
                </button>
                <button
                  onClick={resetImage}
                  className="px-3 h-8 rounded-[9px] hover:bg-[#eef4ff] transition-colors flex items-center justify-center"
                  style={{ border: '1px solid #d5dcec' }}
                  title="New image search"
                >
                  <RotateCcw className="size-3.5 text-[#5a6a84]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
