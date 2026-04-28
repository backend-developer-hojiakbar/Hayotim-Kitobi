export interface RelatedPerson {
  id: string;
  relation: string; // e.g., 'dada', 'ona', 'do'st'
  firstName: string;
  lastName: string;
  birthDate: string;
  address: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  password?: string;
  relatedPersons?: RelatedPerson[];
}

export interface Memory {
  id: string;
  text: string;
  timestamp: number;
}

export interface BookContent {
  title: string;
  author: string;
  coverImage?: string;
  chapters: {
    title: string;
    content: string;
  }[];
}

export type AppStep = 'auth' | 'hero' | 'collection' | 'processing' | 'preview' | 'settings';
