
export interface TranscriptSegment {
  id: string;
  startTime: string;
  speaker: string;
  text: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  url: string;
}

export interface TranscriptionJob {
  id: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  video?: VideoMetadata;
  segments: TranscriptSegment[];
  summary?: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
