import { useRef, ChangeEvent } from 'react';
import { Upload } from 'lucide-react';

interface ModelLoaderProps {
  onFileSelected: (file: File) => void;
}

export function ModelLoader({ onFileSelected }: ModelLoaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      onFileSelected(file);
    } else if (file) {
      alert('Please select a valid GLB or GLTF file');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="absolute top-6 right-6 z-10">
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.9)] px-4 py-3 rounded-[16px] border border-[#d5dcec] shadow-[0px_0px_8px_0px_rgba(45,82,144,0.2)] hover:bg-white transition-colors flex items-center gap-2"
        title="Load 3D Model"
      >
        <Upload size={20} className="text-[#0C1220]" />
        <span className="text-sm font-medium text-[#0C1220]">Load 3D Model</span>
      </button>
    </div>
  );
}
