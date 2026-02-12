
export enum MessageType {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
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
