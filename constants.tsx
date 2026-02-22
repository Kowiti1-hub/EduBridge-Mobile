import React from 'react';
import { Subject } from './types';

export const SUBJECTS: Subject[] = [
  { id: 'math', title: 'Mathematics', icon: '📐', description: 'Algebra, Geometry, and Basic Arithmetic.' },
  { id: 'science', title: 'Science', icon: '🧪', description: 'Biology, Physics, and Chemistry basics.' },
  { id: 'english', title: 'English', icon: '📚', description: 'Grammar, Reading, and Writing skills.' },
  { id: 'health', title: 'Health', icon: '🏥', description: 'Hygiene, Nutrition, and First Aid.' },
  { id: 'finance', title: 'Financial Literacy', icon: '💰', description: 'Savings, Budgeting, and Basic Economics.' },
  { id: 'history', title: 'History', icon: '🏛️', description: 'Learn about past events and civilizations.' },
  { id: 'geography', title: 'Geography', icon: '🌍', description: "Explore Earth's features and human populations." },
  { id: 'art', title: 'Art', icon: '🎨', description: 'Discover painting, sculpture, and creative expression.' }
];

export const USSD_MENU = `
WELCOME TO EDUBRIDGE
Reply with number:
1. Mathematics
2. Science
3. English
4. Health
5. Financial Literacy
6. History
7. Geography
8. Art
0. Help

---------------------
USSD HELP CENTER
---------------------
COMMANDS:
*123# - Main Menu
*5#  - Attachment Menu
*2#  - Previous Lesson
0 or *0# - Help Guide
1-8 - Select Subject
*1*-*8* - Jump to Subject
"Next" - Next lesson
"Menu" - Exit course

HOW TO USE:
1. Reply with a number.
2. Use *n* to switch subjects anytime.
3. Voice/Images in *5# menu.
`;

export const HELP_MESSAGE = `
EDUBRIDGE HELP CENTER
---------------------
COMMANDS:
*123# - Main Menu
*5#  - Attachment Menu
*2#  - Previous Lesson
0 or *0# - This Help Guide
1-8 - Select Subject
*1*-*8* - Jump to Subject
"Next" - Continue lesson
"Menu" - Return to subjects

HOW TO USE:
1. Select a subject by number.
2. Use *n* to switch subjects anytime.
3. Ask any question in chat.
3. Use voice button for audio.
4. "Attachment Menu" has Text, Links, Voice, and Images.

EduBridge works on low-signal 2G/3G networks.
`;