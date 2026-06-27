import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '../utils';

interface DropzoneProps {
  onFileDrop: (file: File) => void;
  isInitial?: boolean;
}

export function Dropzone({ onFileDrop, isInitial = false }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files[0]);
    }
  }, [onFileDrop]);

  if (!isInitial && !isDragging) {
    return null;
  }

  return (
    <div 
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center transition-all bg-[#05070a]/80 backdrop-blur-md",
        isInitial ? "bg-[#05070a] backdrop-blur-none" : ""
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className={cn(
          "max-w-md w-full p-8 rounded-2xl border-2 border-dashed flex flex-col items-center text-center transition-colors bg-slate-900/40 backdrop-blur-xl relative z-10",
          isDragging ? "border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]" : "border-white/10"
        )}
      >
        <div className={cn(
          "p-4 rounded-full mb-4 transition-colors",
          isDragging ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-400"
        )}>
          <UploadCloud size={48} />
        </div>
        <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
          Drop your Course JSON here
        </h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Upload a valid JSON file containing your course structure to begin learning.
        </p>
        
        <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
          Browse Files
          <input 
            type="file" 
            className="hidden" 
            accept="application/json" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFileDrop(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>
      
      {isInitial && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] pointer-events-none rounded-full z-0"></div>
      )}
    </div>
  );
}
