export interface User {
  id: number;
  name: string;
  email?: string;
  nickname?: string;
}

export interface AttachedFile {
  id: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  downloadUrl: string;
}

export interface AttachedLink {
  id: number;
  url: string;
  title?: string;
}

export interface Comment {
  id: number;
  content: string;
  author: User;
  createdAt: string;
  parentId?: number;
  targetUser?: string;
  replies?: Comment[];
}

export interface Board {
  id: number;
  title: string;
  content: string;
  author: User;
  createdAt?: string;
  updatedAt?: string;
  viewCount?: number;
  created_at?: string;
  updated_at?: string;
  view_count?: number;
  files?: AttachedFile[];
  links?: AttachedLink[];
  comments?: Comment[];
}

export interface BoardListParams {
  page: number;
  limit: number;
  searchType?: 'title' | 'content';
  searchKeyword?: string;
}

export interface BoardListResponse {
  boards: Board[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  prevPost?: { id: number; title: string };
  nextPost?: { id: number; title: string };
}

export interface BoardFormData {
  title: string;
  content: string;
  files?: File[];
  links?: string[];
}

export interface SearchParams {
  searchType: 'title' | 'content';
  searchKeyword: string;
}


