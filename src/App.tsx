/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainArea } from './components/MainArea';
import { Dropzone } from './components/Dropzone';
import { CourseMeta, getCoursesList, getCourse, saveCourse, deleteCourse, getLastActiveCourseId, setLastActiveCourseId, getUserSettings, saveUserSettings, UserSettings } from './db';
import { CourseItem, Course as CourseType } from './types';
import { Settings } from 'lucide-react';

export default function App() {
  const [coursesList, setCoursesList] = useState<CourseMeta[]>([]);
  const [currentCourse, setCurrentCourse] = useState<CourseType | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<CourseItem | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({ playbackRate: 1, autoplay: false });
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  
  const [showUploader, setShowUploader] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const selectFirstUnwatchedVideo = useCallback((course: CourseType, settings: UserSettings) => {
    if (!course || !course.modules) return;

    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
      const module = course.modules[mIdx];
      if (!module.sections) continue;
      for (let sIdx = 0; sIdx < module.sections.length; sIdx++) {
        const section = module.sections[sIdx];
        if (!section.items) continue;
        for (let iIdx = 0; iIdx < section.items.length; iIdx++) {
          const item = section.items[iIdx];
          const itemId = `${mIdx}-${sIdx}-${iIdx}`;
          if (item.video && !settings.watchedItems?.[itemId]) {
            setActiveItemId(itemId);
            setActiveItem(item);
            return;
          }
        }
      }
    }
  }, []);

  // Initialize App
  useEffect(() => {
    const initApp = async () => {
      try {
        const settings = await getUserSettings();
        setUserSettings(settings);

        const list = await getCoursesList();
        setCoursesList(list);

        const lastId = await getLastActiveCourseId();
        
        if (lastId && list.find(c => c.id === lastId)) {
          const loadedCourse = await getCourse(lastId);
          if (loadedCourse) {
            setCurrentCourse(loadedCourse);
            selectFirstUnwatchedVideo(loadedCourse, settings);
          }
        } else if (list.length > 0) {
          // Fallback to latest uploaded
          const latest = list.sort((a, b) => b.createdAt - a.createdAt)[0];
          const loadedCourse = await getCourse(latest.id);
          if (loadedCourse) {
            setCurrentCourse(loadedCourse);
            await setLastActiveCourseId(latest.id);
            selectFirstUnwatchedVideo(loadedCourse, settings);
          }
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsAppLoading(false);
      }
    };
    initApp();
  }, [selectFirstUnwatchedVideo]);

  // Handle global drag events to show dropzone
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        setShowUploader(true);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    return () => window.removeEventListener('dragenter', handleDragEnter);
  }, []);

  const handleSelectCourse = async (id: string) => {
    const loadedCourse = await getCourse(id);
    if (loadedCourse) {
      setCurrentCourse(loadedCourse);
      setActiveItemId(null);
      setActiveItem(null);
      await setLastActiveCourseId(id);
      selectFirstUnwatchedVideo(loadedCourse, userSettings);
    }
  };

  const handleFileDrop = async (file: File) => {
    setShowUploader(false);
    
    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);
      
      // Basic validation: must be an array (based on user example)
      if (!Array.isArray(parsedData)) {
        alert("Invalid format: The JSON file should contain an array of modules at the root.");
        return;
      }

      const newCourse: CourseType = {
        id: crypto.randomUUID(),
        name: file.name.replace('.json', ''),
        modules: parsedData,
        createdAt: Date.now()
      };

      await saveCourse(newCourse);
      
      const list = await getCoursesList();
      setCoursesList(list);
      
      setCurrentCourse(newCourse);
      setActiveItemId(null);
      setActiveItem(null);
      await setLastActiveCourseId(newCourse.id);
      selectFirstUnwatchedVideo(newCourse, userSettings);
      
    } catch (err) {
      console.error(err);
      alert("Failed to parse JSON file. Please ensure it's valid.");
    }
  };

  const handleSelectItem = (item: CourseItem, id: string) => {
    setActiveItem(item);
    setActiveItemId(id);
  };

  const handleDeleteCourse = async (id: string) => {
    await deleteCourse(id);
    const list = await getCoursesList();
    setCoursesList(list);

    if (currentCourse?.id === id) {
      setCurrentCourse(null);
      setActiveItemId(null);
      setActiveItem(null);
      await setLastActiveCourseId(null);

      if (list.length > 0) {
        const latest = list.sort((a, b) => b.createdAt - a.createdAt)[0];
        const loadedCourse = await getCourse(latest.id);
        if (loadedCourse) {
          setCurrentCourse(loadedCourse);
          await setLastActiveCourseId(latest.id);
        }
      }
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    setUserSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveUserSettings(updated); // Background async save
      return updated;
    });
  };

  const handleRateChange = (rate: number) => {
    handleUpdateSettings({ playbackRate: rate });
  };

  const handleQualityChange = (quality: string) => {
    handleUpdateSettings({ videoQuality: quality });
  };

  const handleTimeUpdate = (itemId: string, time: number) => {
    setUserSettings(prev => {
      const videoProgress = { ...(prev.videoProgress || {}) };
      videoProgress[itemId] = time;
      const updated = { ...prev, videoProgress };
      saveUserSettings(updated);
      return updated;
    });
  };

  const handleToggleWatched = (itemId: string) => {
    setUserSettings(prev => {
      const watchedItems = { ...(prev.watchedItems || {}) };
      watchedItems[itemId] = !watchedItems[itemId];
      const updated = { ...prev, watchedItems };
      saveUserSettings(updated);
      return updated;
    });
  };

  if (isAppLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#05070a] text-slate-500">Loading...</div>;
  }

  const isInitialState = coursesList.length === 0;

  return (
    <div className="relative flex w-full h-screen overflow-hidden bg-[#05070a] text-slate-300 font-sans">
      {(isInitialState || showUploader) && (
        <Dropzone 
          onFileDrop={handleFileDrop} 
          isInitial={isInitialState}
        />
      )}
      
      {!isInitialState && (
        <>
          {showSettingsSidebar ? (
            <div className="w-80 flex-shrink-0 border-r border-white/5 bg-slate-900/40 backdrop-blur-xl flex flex-col relative z-10 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white tracking-tight text-lg">Settings</span>
                <button onClick={() => setShowSettingsSidebar(false)} className="text-slate-400 hover:text-white transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Autoplay Videos</span>
                  <button 
                    onClick={() => handleUpdateSettings({ autoplay: !userSettings.autoplay })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${userSettings.autoplay ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${userSettings.autoplay ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Sidebar 
              courses={coursesList}
              currentCourse={currentCourse}
              onSelectCourse={handleSelectCourse}
              onUploadClick={() => setShowUploader(true)}
              activeItemId={activeItemId}
              onSelectItem={handleSelectItem}
              onOpenSettings={() => setShowSettingsSidebar(true)}
              onDeleteCourse={handleDeleteCourse}
              watchedItems={userSettings.watchedItems || {}}
            />
          )}
          <MainArea 
            item={activeItem} 
            itemId={activeItemId}
            settings={userSettings}
            onRateChange={handleRateChange}
            onQualityChange={handleQualityChange}
            onTimeUpdate={handleTimeUpdate}
            onToggleWatched={handleToggleWatched}
          />
        </>
      )}
      
      {/* Overlay to hide dropzone when clicking outside (if we wanted to cancel) */}
      {showUploader && !isInitialState && (
        <button 
          className="absolute top-4 right-4 z-[60] bg-white/5 text-slate-300 px-4 py-2 rounded-md border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
          onClick={() => setShowUploader(false)}
        >
          Cancel Upload
        </button>
      )}
    </div>
  );
}
