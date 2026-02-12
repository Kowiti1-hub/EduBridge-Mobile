
import React from 'react';
import { Subject } from './types';

export const SUBJECTS: Subject[] = [
  { id: 'math', title: 'Mathematics', icon: '📐', description: 'Algebra, Geometry, and Basic Arithmetic.' },
  { id: 'science', title: 'Science', icon: '🧪', description: 'Biology, Physics, and Chemistry basics.' },
  { id: 'english', title: 'English', icon: '📚', description: 'Grammar, Reading, and Writing skills.' },
  { id: 'health', title: 'Health', icon: '🏥', description: 'Hygiene, Nutrition, and First Aid.' },
  { id: 'finance', title: 'Financial Literacy', icon: '💰', description: 'Savings, Budgeting, and Basic Economics.' }
];

export const USSD_MENU = `
WELCOME TO EDUBRIDGE
Reply with number:
1. Mathematics
2. Science
3. English
4. Health
5. Financial Literacy
0. Help
`;

export const HELP_MESSAGE = `
EDUBRIDGE HELP CENTER
---------------------
COMMANDS:
*123# - Main Menu
0 - This Help Guide
1-5 - Select Subject
"Next" - Continue lesson
"Menu" - Return to subjects

HOW TO USE:
1. Select a subject by number.
2. Ask any question in chat.
3. Use voice button for audio.
4. Replies are short to save data.

EduBridge works on low-signal 2G/3G networks.
`;
