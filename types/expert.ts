import { Timestamp } from 'firebase/firestore';

export type PostCategory = 'research' | 'news' | 'guide' | 'warning' | 'myth';

export interface PostSource {
  title: string;
  url: string;
  type: 'pubmed' | 'scholar' | 'journal' | 'official' | 'other';
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  likes: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ExpertPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorSpecialization: string;
  title: string;
  content: string;
  excerpt?: string; // Short summary for feed
  category: PostCategory;
  tags?: string[];
  imageUrl?: string;
  sources: PostSource[]; // Mandatory
  likes: number;
  likedBy?: string[]; // Array of user uids
  comments: PostComment[];
  commentCount: number;
  views: number;
  published: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp;
}

export interface ExpertApplication {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  articleUrl: string;
  specialization: string;
  institution: string;
  additionalInfo?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string; // Admin uid
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  createdAt: Timestamp;
}
