
export enum MessageType {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
  NOTE = 'note',
  LINK = 'link',
  AUDIO = 'audio',
  IMAGE = 'image'
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  isUssd?: boolean;
  metadata?: {
    lessonNum?: number;
    totalLessons?: number;
    isComplete?: boolean;
    url?: string;
    audioData?: string; // Base64 encoded audio
    imageData?: string; // Base64 encoded image
    duration?: number;  // Seconds
  };
}

export interface Subject {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export interface LessonContent {
  title: string;
  theory: string;
  question: string;
}

export interface LearningState {
  currentSubject: string | null;
  history: Message[];
  isThinking: boolean;
}
