import { get, set, del } from 'idb-keyval';
import { Course } from './types';

const COURSES_LIST_KEY = 'courses_list';

export interface UserSettings {
  playbackRate: number;
  autoplay: boolean;
  videoQuality?: string;
  videoProgress?: Record<string, number>;
  watchedItems?: Record<string, boolean>;
}

const SETTINGS_KEY = 'user_settings';
const DEFAULT_SETTINGS: UserSettings = {
  playbackRate: 1,
  autoplay: false,
  videoQuality: 'Auto',
  videoProgress: {},
  watchedItems: {},
};

export async function getUserSettings(): Promise<UserSettings> {
  const settings = await get<UserSettings>(SETTINGS_KEY);
  return settings || DEFAULT_SETTINGS;
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await set(SETTINGS_KEY, settings);
}

export interface CourseMeta {
  id: string;
  name: string;
  createdAt: number;
}

export async function getCoursesList(): Promise<CourseMeta[]> {
  const list = await get<CourseMeta[]>(COURSES_LIST_KEY);
  return list || [];
}

export async function getCourse(id: string): Promise<Course | undefined> {
  return await get<Course>(`course_${id}`);
}

export async function saveCourse(course: Course): Promise<void> {
  await set(`course_${course.id}`, course);
  const list = await getCoursesList();
  const existingIndex = list.findIndex(c => c.id === course.id);
  
  const meta: CourseMeta = {
    id: course.id,
    name: course.name,
    createdAt: course.createdAt,
  };

  if (existingIndex >= 0) {
    list[existingIndex] = meta;
  } else {
    list.push(meta);
  }
  
  await set(COURSES_LIST_KEY, list);
}

export async function getLastActiveCourseId(): Promise<string | undefined> {
  return await get<string>('last_active_course');
}

export async function setLastActiveCourseId(id: string | null): Promise<void> {
  if (id === null) {
    await del('last_active_course');
  } else {
    await set('last_active_course', id);
  }
}

export async function deleteCourse(id: string): Promise<void> {
  await del(`course_${id}`);
  const list = await getCoursesList();
  const newList = list.filter(c => c.id !== id);
  await set(COURSES_LIST_KEY, newList);
}
