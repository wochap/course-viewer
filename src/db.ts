import { get, set } from 'idb-keyval';
import { Course } from './types';

const COURSES_LIST_KEY = 'courses_list';

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

export async function setLastActiveCourseId(id: string): Promise<void> {
  await set('last_active_course', id);
}
