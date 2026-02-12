
import { LessonContent } from './types';

export const LESSON_DATA: Record<string, Record<number, LessonContent>> = {
  math: {
    1: { title: "Simple Addition", theory: "Addition is combining two numbers to find a total sum. For example, 2 apples + 3 apples = 5 apples.", question: "What is 4 + 5?" },
    2: { title: "Basic Subtraction", theory: "Subtraction is taking away one number from another. If you have 10 oranges and eat 3, you have 7 left.", question: "What is 15 - 6?" },
    3: { title: "Introduction to Multiplication", theory: "Multiplication is repeated addition. 2 x 3 is the same as 2 + 2 + 2.", question: "What is 3 x 4?" },
    4: { title: "Simple Division", theory: "Division is splitting a large group into equal smaller groups.", question: "What is 10 divided by 2?" },
    5: { title: "Fractions Basics", theory: "A fraction represents part of a whole. 1/2 is one part out of two equal parts.", question: "If you cut a pizza into 4 slices and eat 1, what fraction is left?" }
  },
  science: {
    1: { title: "The Water Cycle", theory: "Water moves from earth to sky and back. Evaporation, Condensation, Precipitation.", question: "What happens when water turns into steam?" },
    2: { title: "Living vs Non-Living", theory: "Living things grow, breathe, and reproduce. Non-living things do not.", question: "Is a rock living or non-living?" },
    3: { title: "Our Solar System", theory: "The Sun is at the center. 8 planets revolve around it. Earth is the 3rd planet.", question: "Which planet is known as the Red Planet?" },
    4: { title: "Plant Parts", theory: "Roots soak up water, stems support the plant, leaves make food, flowers make seeds.", question: "Which part of the plant grows underground?" },
    5: { title: "Force and Motion", theory: "A push or pull on an object is called force. It makes things move or stop.", question: "What do we call the force that pulls things to the ground?" }
  },
  english: {
    1: { title: "Nouns", theory: "A noun is a name of a person, place, animal, or thing.", question: "In 'The dog runs', which word is a noun?" },
    2: { title: "Verbs", theory: "Verbs are action words. They tell us what someone is doing.", question: "Find the verb: 'She sings loudly'." },
    3: { title: "Adjectives", theory: "Adjectives describe nouns. They tell us about color, size, or shape.", question: "What is the adjective in 'The big blue house'?" },
    4: { title: "Punctuation", theory: "Periods (.) end sentences. Question marks (?) ask things.", question: "Which symbol do you use after 'How are you'?" },
    5: { title: "Synonyms", theory: "Synonyms are words that have the same or similar meaning. Large and Big are synonyms.", question: "What is a synonym for 'Happy'?" }
  },
  health: {
    1: { title: "Hand Washing", theory: "Wash hands with soap for 20 seconds to kill germs and prevent sickness.", question: "How long should you wash your hands?" },
    2: { title: "Balanced Diet", theory: "Eat fruits, vegetables, proteins, and grains to keep your body strong.", question: "Is a lollipop part of a balanced diet?" },
    3: { title: "Dental Care", theory: "Brush twice a day to prevent cavities. Sugar causes tooth decay.", question: "How many times a day should you brush?" },
    4: { title: "Physical Activity", theory: "Running and playing keeps your heart healthy and muscles strong.", question: "True or False: Sitting all day is good for health." },
    5: { title: "Sleep and Rest", theory: "Your body needs 8 hours of sleep to repair itself and give you energy.", question: "How many hours of sleep do children usually need?" }
  },
  finance: {
    1: { title: "What is Money?", theory: "Money is something people use to buy goods (things) and services (actions).", question: "Is hair cutting a good or a service?" },
    2: { title: "Needs vs Wants", theory: "Needs are things for survival (food, water). Wants are things you'd like but don't need (toys).", question: "Is a smartphone a need or a want?" },
    3: { title: "Saving Money", theory: "Saving is keeping money for the future instead of spending it now.", question: "If you save $1 every day, how much do you have after a week?" },
    4: { title: "Budgeting", theory: "A budget is a plan for how to spend and save your money.", question: "Why is it important to have a plan for your money?" },
    5: { title: "Earning Money", theory: "People earn money by working or providing a service to others.", question: "What is the money you receive for working called?" }
  }
};
