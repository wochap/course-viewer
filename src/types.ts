export interface CourseFile {
  title: string;
  url: string;
}

export interface CourseVideo {
  url: string;
  headers?: Record<string, string>;
}

export interface CourseItem {
  title: string;
  video?: CourseVideo;
  files?: CourseFile[];
}

export interface CourseSection {
  title: string;
  items: CourseItem[];
}

export interface CourseModule {
  id: number | string;
  title: string;
  sections: CourseSection[];
}

export interface Course {
  id: string;
  name: string;
  modules: CourseModule[];
  createdAt: number;
}
