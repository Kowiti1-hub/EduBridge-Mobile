
export enum MessageType {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
  NOTE = 'note',
  LINK = 'link',
  AUDIO = 'audio',
  IMAGE = 'image',
  VIDEO = 'video'
}

export enum EducationLevel {
  PRE_SCHOOL = 'pre-school',
  ELEMENTARY = 'elementary',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary'
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
    videoUrl?: string;  // URL to the generated video
    duration?: number;  // Seconds
    isHighQuality?: boolean;
    isDownloaded?: boolean;
    educationLevel?: EducationLevel;
    yearOfStudy?: number;
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
