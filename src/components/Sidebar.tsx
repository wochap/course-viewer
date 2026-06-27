import React, { useState } from 'react';
import { Course, CourseModule, CourseSection, CourseItem } from '../types';
import { cn } from '../utils';

interface SidebarProps {
  courses: { id: string; name: string }[];
  currentCourse: Course | null;
  onSelectCourse: (id: string) => void;
  onUploadClick: () => void;
  activeItemId: string | null;
  onSelectItem: (item: CourseItem, id: string) => void;
}

export function Sidebar({
  courses,
  currentCourse,
  onSelectCourse,
  onUploadClick,
  activeItemId,
  onSelectItem,
}: SidebarProps) {
  return (
    <aside className="w-80 flex-shrink-0 border-r border-white/5 bg-slate-900/40 backdrop-blur-xl flex flex-col relative z-10">
      <div className="p-6 space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.246 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <span className="font-bold text-white tracking-tight text-lg">Insight Academy</span>
        </div>

        {/* Course Selector */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Active Course</label>
          <div className="relative">
            <select
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white"
              value={currentCourse?.id || ''}
              onChange={(e) => onSelectCourse(e.target.value)}
            >
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none opacity-40">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <button
          onClick={onUploadClick}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          Upload JSON Course
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {currentCourse ? (
          <div>
            {currentCourse.modules.map((module, mIdx) => (
              <ModuleNode 
                key={`m-${mIdx}`} 
                module={module} 
                mIdx={mIdx}
                activeItemId={activeItemId}
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 text-sm mt-10">
            No course selected
          </div>
        )}
      </div>
    </aside>
  );
}

function ModuleNode({ module, mIdx, activeItemId, onSelectItem }: { 
  module: CourseModule; 
  mIdx: number;
  activeItemId: string | null;
  onSelectItem: (item: CourseItem, id: string) => void;
}) {
  return (
    <div className="mb-6">
      <h4 className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 line-clamp-2">{module.title}</h4>
      <div className="space-y-4">
        {module.sections.map((section, sIdx) => (
          <SectionNode 
            key={`s-${sIdx}`} 
            section={section} 
            mIdx={mIdx} 
            sIdx={sIdx}
            activeItemId={activeItemId}
            onSelectItem={onSelectItem}
          />
        ))}
      </div>
    </div>
  );
}

function SectionNode({ section, mIdx, sIdx, activeItemId, onSelectItem }: { 
  section: CourseSection;
  mIdx: number;
  sIdx: number;
  activeItemId: string | null;
  onSelectItem: (item: CourseItem, id: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="px-2 py-1 text-xs font-semibold text-blue-400 opacity-80">{section.title}</div>
      {section.items.map((item, iIdx) => {
        const itemId = `${mIdx}-${sIdx}-${iIdx}`;
        const isActive = activeItemId === itemId;
        return (
          <div
            key={itemId}
            onClick={() => onSelectItem(item, itemId)}
            className={cn(
              "group cursor-pointer p-2",
              isActive 
                ? "bg-blue-500/10 border-l-2 border-blue-500 rounded-r-md" 
                : "hover:bg-white/5 rounded-md"
            )}
          >
            <p className={cn(
              "text-xs line-clamp-2 transition-colors",
              isActive ? "text-white font-medium" : "text-slate-400 group-hover:text-slate-200"
            )}>
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[10px] flex items-center gap-1",
                isActive ? "text-blue-300" : "text-slate-500"
              )}>
                {item.video ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                )}
                {item.video ? "Video" : "Document"}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  );
}
