import React, { useState } from 'react';
import { CourseItem } from '../types';
import { FileText, Download, ExternalLink, VideoOff } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { UserSettings } from '../db';
import { cn } from '../utils';

interface MainAreaProps {
  item: CourseItem | null;
  itemId?: string | null;
  settings: UserSettings;
  onRateChange: (rate: number) => void;
  onQualityChange?: (quality: string) => void;
  onTimeUpdate?: (itemId: string, time: number) => void;
  onToggleWatched?: (itemId: string) => void;
}

export function MainArea({ item, itemId, settings, onRateChange, onQualityChange, onTimeUpdate, onToggleWatched }: MainAreaProps) {
  if (!item) {
    return (
      <div className="flex-1 flex flex-col relative bg-[#05070a]">
        <div className="flex-1 flex items-center justify-center text-slate-500 z-10">
          <div className="text-center">
            <PlayCirclePlaceholder className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Select a class to start learning</p>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] pointer-events-none rounded-full z-0"></div>
      </div>
    );
  }

  const isWatched = itemId && settings.watchedItems?.[itemId];

  return (
    <main className="flex-1 flex flex-col relative bg-[#05070a] overflow-hidden">
      {/* Header / Breadcrumbs */}
      <header className="h-16 flex items-center px-8 border-b border-white/5 justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 line-clamp-1">Insight Academy</span>
          <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
          <span className="text-blue-400 line-clamp-1">{item.title}</span>
        </div>
        {itemId && onToggleWatched && (
          <button
            onClick={() => onToggleWatched(itemId)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
              isWatched
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {isWatched ? "Watched" : "Mark as Watched"}
          </button>
        )}
      </header>

      <div className="flex-1 p-8 space-y-8 overflow-y-auto relative z-10">
        {/* Video Player Area */}
        <section className="relative group">
          <div className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative flex items-center justify-center z-10">
            {item.video?.url ? (
              <VideoPlayer
                onRateChange={onRateChange}
                onQualityChange={onQualityChange}
                onTimeUpdate={(time) => onTimeUpdate && itemId && onTimeUpdate(itemId, time)}
                options={{
                  autoplay: settings.autoplay,
                  controls: true,
                  responsive: true,
                  fluid: true,
                  videoQuality: settings.videoQuality,
                  startTime: (itemId && settings.videoProgress?.[itemId]) || 0,
                  playbackRate: settings.playbackRate,
                  playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
                  sources: [{
                    src: item.video.url,
                    type: 'application/x-mpegURL'
                  }]
                }}
              />
            ) : (
              <div className="text-slate-500 flex flex-col items-center">
                <VideoOff size={48} className="mb-2 opacity-50" />
                <p>No video available for this class</p>
              </div>
            )}
          </div>
        </section>

        {/* Information & Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{item.title}</h1>
          </div>

          {/* Files Section */}
          <div className="space-y-4">
            {item.files && item.files.length > 0 && (
              <>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recursos de Clase</h3>
                <div className="space-y-2">
                  {item.files.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-200 truncate">{file.title}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Atmospheric Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] pointer-events-none rounded-full z-0"></div>
    </main>
  );
}

function PlayCirclePlaceholder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  )
}
