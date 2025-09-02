export type Theme = 'light' | 'dark';
export type Channel = 'All' | 'Personal' | 'Business';

export interface Attachment {
  name: string;
  size: number; // in bytes
}

export interface Reply {
  id: number;
  sender: string;
  body: string;
  timestamp: string;
  avatar: string;
  attachment?: Attachment;
}

export interface Message {
  id: number;
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
  channel: 'Personal' | 'Business';
  avatar: string;
  read: boolean;
  replies: Reply[];
}

export type Priority = 'High Priority' | 'Normal' | 'Low Priority' | 'Unknown';

export interface AIAnalysisResult {
    priority: Priority;
    summary: string;
    replies: string[];
}