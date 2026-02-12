
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
  },
  history: {
    1: { 
      title: "Ancient Egypt", 
      theory: "Ancient Egypt was a powerful civilization along the Nile River. They are famous for building massive stone pyramids as tombs for their kings, called Pharaohs. They also created a unique writing system using pictures called Hieroglyphics.", 
      question: "What were the kings of Ancient Egypt called?" 
    },
    2: { 
      title: "The Roman Empire", 
      theory: "The Romans built a vast empire that covered most of Europe and North Africa. They were incredible engineers, building strong roads and massive structures like the Colosseum. Their language, Latin, and their laws still influence the world today.", 
      question: "Which language was spoken by the Romans?" 
    },
    3: { 
      title: "The Middle Ages", 
      theory: "This era followed the fall of Rome and is often called the age of knights and castles. Society was divided into ranks, with kings at the top and peasants at the bottom. It was a time of many wars but also the birth of great cathedrals.", 
      question: "What were the large fortified stone buildings where kings and lords lived called?" 
    },
    4: { 
      title: "Industrial Revolution", 
      theory: "In the 1700s and 1800s, the world changed from farming to manufacturing. Steam power allowed machines in factories to make products much faster than by hand. This led to the growth of big cities and the invention of trains.", 
      question: "True or False: The Industrial Revolution made it slower to produce goods." 
    },
    5: { 
      title: "The Renaissance", 
      theory: "The Renaissance was a 'rebirth' of art and science in Europe. It was a time of famous thinkers and artists like Leonardo da Vinci. People began to explore new ideas about the world, leading to many great discoveries.", 
      question: "Which famous artist and inventor painted the Mona Lisa?" 
    }
  },
  geography: {
    1: { title: "The Seven Continents", theory: "Earth's land is divided into 7 large areas: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.", question: "Which continent are the pyramids located in?" },
    2: { title: "Oceans of the World", theory: "Most of Earth is covered by saltwater oceans. The largest is the Pacific Ocean.", question: "How many major oceans are there on Earth?" },
    3: { title: "Climate Zones", theory: "Different parts of Earth have different weather patterns: Tropical, Temperate, and Polar.", question: "Which zone is very cold all year round?" },
    4: { title: "Mountains and Rivers", theory: "Mountains are high landforms, while rivers are flowing bodies of fresh water.", question: "What is the highest mountain in the world?" },
    5: { title: "Maps and Globes", theory: "A map is a flat drawing of a place, while a globe is a 3D model of the Earth.", question: "What do we call the line that divides Earth into North and South?" }
  },
  art: {
    1: { title: "Primary Colors", theory: "Red, Yellow, and Blue are the three base colors. You can mix them to make all other colors.", question: "What color do you get if you mix Red and Yellow?" },
    2: { title: "Shapes and Forms", theory: "Shapes are 2D (circles, squares), while forms are 3D (spheres, cubes).", question: "Is a ball a shape or a form?" },
    3: { title: "Famous Paintings", theory: "Artists like Van Gogh and Da Vinci used paint to express emotions and stories.", question: "Who painted 'The Starry Night'?" },
    4: { title: "Sculpture", theory: "Sculpture is art that you can walk around. It can be made of clay, stone, or wood.", question: "Is a statue a 2D or 3D piece of art?" },
    5: { title: "Texture in Art", theory: "Texture is how an object feels or looks like it feels (rough, smooth, soft).", question: "What word describes the texture of sandpaper?" }
  }
};
