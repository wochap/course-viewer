/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainArea } from './components/MainArea';
import { Dropzone } from './components/Dropzone';
import { CourseMeta, getCoursesList, getCourse, saveCourse, getLastActiveCourseId, setLastActiveCourseId } from './db';
import { CourseItem, Course as CourseType } from './types';

export default function App() {
  const [coursesList, setCoursesList] = useState<CourseMeta[]>([]);
  const [currentCourse, setCurrentCourse] = useState<CourseType | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<CourseItem | null>(null);
  
  const [showUploader, setShowUploader] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Initialize App
  useEffect(() => {
    const initApp = async () => {
      try {
        const list = await getCoursesList();
        setCoursesList(list);

        const lastId = await getLastActiveCourseId();
        
        if (lastId && list.find(c => c.id === lastId)) {
          const loadedCourse = await getCourse(lastId);
          if (loadedCourse) {
            setCurrentCourse(loadedCourse);
          }
        } else if (list.length > 0) {
          // Fallback to latest uploaded
          const latest = list.sort((a, b) => b.createdAt - a.createdAt)[0];
          const loadedCourse = await getCourse(latest.id);
          if (loadedCourse) {
            setCurrentCourse(loadedCourse);
            await setLastActiveCourseId(latest.id);
          }
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsAppLoading(false);
      }
    };
    initApp();
  }, []);

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
      
    } catch (err) {
      console.error(err);
      alert("Failed to parse JSON file. Please ensure it's valid.");
    }
  };

  const handleSelectItem = (item: CourseItem, id: string) => {
    setActiveItem(item);
    setActiveItemId(id);
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
          <Sidebar 
            courses={coursesList}
            currentCourse={currentCourse}
            onSelectCourse={handleSelectCourse}
            onUploadClick={() => setShowUploader(true)}
            activeItemId={activeItemId}
            onSelectItem={handleSelectItem}
          />
          <MainArea item={activeItem} />
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
