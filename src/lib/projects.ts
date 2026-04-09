export interface ProjectPhase {
  name: string;
  turns: string; // e.g. "2-3"
  goal: string;
  generateImage?: boolean; // trigger image at end of this phase
  imagePromptHint?: string; // hint for DALL-E prompt generation
}

export interface Project {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  prompt: string;
  keywords: string[]; // for detecting project from first message
  phases: ProjectPhase[];
}

export const PROJECTS: Project[] = [
  {
    id: "volcano",
    title: "Build a Volcano",
    description: "Design an erupting volcano and learn why they explode",
    icon: "🌋",
    category: "Science",
    color: "from-red-500 to-orange-500",
    prompt: "I want to do the volcano project! Help me design and understand how volcanoes work.",
    keywords: ["volcano"],
    phases: [
      { name: "The Big Boom", turns: "2-3", goal: "What makes volcanoes erupt? Explore pressure, magma, and tectonic plates", generateImage: true, imagePromptHint: "a cutaway diagram of a volcano showing magma chamber and tectonic plates, colorful educational illustration for kids" },
      { name: "Design Your Volcano", turns: "3-4", goal: "Pick a type (shield, stratovolcano, cinder cone), design the shape and size" },
      { name: "Inside the Volcano", turns: "3-4", goal: "What's happening underground? Magma chambers, lava tubes, gas buildup", generateImage: true, imagePromptHint: "cross-section of a volcano interior showing glowing magma tubes and gas chambers, vibrant kids illustration" },
      { name: "The Eruption", turns: "2-3", goal: "Simulate the eruption — what comes out, how far does it go, what happens to the land?" },
      { name: "Your Volcano Report", turns: "1-2", goal: "Wrap up: summarize what you learned and present your volcano design", generateImage: true, imagePromptHint: "a dramatic erupting volcano with lava flows and ash clouds, the kid's final volcano design, epic colorful illustration" },
    ],
  },
  {
    id: "space-mission",
    title: "Space Mission",
    description: "Plan a mission to Mars and solve real space problems",
    icon: "🚀",
    category: "Science",
    color: "from-indigo-500 to-purple-500",
    prompt: "I want to plan a space mission to Mars! Help me figure out what we need.",
    keywords: ["space", "mars", "mission"],
    phases: [
      { name: "Mission Goal", turns: "2-3", goal: "What's the mission? Explore Mars, build a base, find water?", generateImage: true, imagePromptHint: "a Mars landscape with a small astronaut looking at the red planet horizon, concept art, kid-friendly illustration" },
      { name: "Build the Ship", turns: "3-4", goal: "Design the spacecraft — fuel, engines, living quarters, supplies" },
      { name: "Survive the Journey", turns: "3-4", goal: "6 months in space — food, exercise, radiation, boredom", generateImage: true, imagePromptHint: "interior of a spacecraft with astronaut living quarters, floating food and exercise equipment, fun kids illustration" },
      { name: "Land on Mars", turns: "3-4", goal: "Landing strategy, first steps, setting up base" },
      { name: "Mission Debrief", turns: "1-2", goal: "Present your mission plan — would NASA approve it?", generateImage: true, imagePromptHint: "a completed Mars base with dome habitats, solar panels, and a rocket, epic kid-friendly space illustration" },
    ],
  },
  {
    id: "mystery-novel",
    title: "Mystery Story",
    description: "Write a detective story with twists and clues",
    icon: "🔍",
    category: "Writing",
    color: "from-amber-500 to-yellow-500",
    prompt: "I want to write a mystery story! Let's create a detective adventure together.",
    keywords: ["mystery", "detective", "story", "novel"],
    phases: [
      { name: "The Crime", turns: "2-3", goal: "What happened? Set the scene — what was stolen/who disappeared?", generateImage: true, imagePromptHint: "a mysterious crime scene with clues scattered around, dark atmospheric detective illustration for kids" },
      { name: "The Detective", turns: "2-3", goal: "Create your main character — what makes them special at solving mysteries?" },
      { name: "Clues & Suspects", turns: "3-4", goal: "Plant 3 clues and 2-3 suspects — red herrings included!", generateImage: true, imagePromptHint: "a detective's evidence board with photos, string connections, and clue notes, colorful mystery illustration" },
      { name: "The Chase", turns: "3-4", goal: "Write the investigation — following leads, interviewing suspects, close calls" },
      { name: "The Big Reveal", turns: "2-3", goal: "Solve it! Write the twist ending where the detective cracks the case", generateImage: true, imagePromptHint: "a detective triumphantly solving the case, dramatic reveal moment, kid-friendly mystery book cover style" },
    ],
  },
  {
    id: "game-designer",
    title: "Design a Game",
    description: "Invent your own video game with characters and levels",
    icon: "🎮",
    category: "Engineering",
    color: "from-green-500 to-emerald-500",
    prompt: "I want to design my own video game! Help me plan the characters, levels, and gameplay.",
    keywords: ["game", "video game"],
    phases: [
      { name: "Game Concept", turns: "2-3", goal: "What kind of game? Platformer, RPG, puzzle? What's the goal?", generateImage: true, imagePromptHint: "a video game title screen with colorful pixel art style, fun and exciting game concept art for kids" },
      { name: "Hero & Villain", turns: "3-4", goal: "Design the main character and the enemy — abilities, backstory, look" },
      { name: "World Building", turns: "3-4", goal: "Create 3 levels/worlds — themes, obstacles, secrets", generateImage: true, imagePromptHint: "a vibrant video game world map showing different themed levels, colorful game design illustration" },
      { name: "Power-ups & Mechanics", turns: "3-4", goal: "What special moves, items, and rules make your game fun?" },
      { name: "Game Pitch", turns: "1-2", goal: "Pitch your game like you're presenting to a game company!", generateImage: true, imagePromptHint: "a polished video game box art cover with the hero character in action pose, professional game art style for kids" },
    ],
  },
  {
    id: "robot-inventor",
    title: "Invent a Robot",
    description: "Design a robot that solves a real-world problem",
    icon: "🤖",
    category: "Engineering",
    color: "from-cyan-500 to-blue-500",
    prompt: "I want to invent a robot! Help me figure out what it should do and how it works.",
    keywords: ["robot", "invent"],
    phases: [
      { name: "The Problem", turns: "2-3", goal: "What real problem does your robot solve? Who needs it?", generateImage: true, imagePromptHint: "a friendly robot concept sketch on a blueprint background, clean and fun engineering illustration for kids" },
      { name: "Robot Design", turns: "3-4", goal: "Shape, size, how it moves — wheels, legs, flying? What does it look like?" },
      { name: "Robot Brain", turns: "3-4", goal: "Sensors, cameras, AI — how does it see, think, and decide?", generateImage: true, imagePromptHint: "a detailed robot with visible sensors, cameras, and glowing brain circuits, fun technical illustration for kids" },
      { name: "Build & Test", turns: "3-4", goal: "What could go wrong? How do you test it? Fix the bugs!" },
      { name: "Robot Launch", turns: "1-2", goal: "Name your robot and present it to the world — what makes it special?", generateImage: true, imagePromptHint: "a polished robot on a stage being revealed to a cheering crowd, epic product launch illustration for kids" },
    ],
  },
  {
    id: "ocean-explorer",
    title: "Ocean Explorer",
    description: "Dive deep and discover creatures of the abyss",
    icon: "🐙",
    category: "Science",
    color: "from-blue-500 to-teal-500",
    prompt: "I want to explore the deep ocean! What weird creatures live down there?",
    keywords: ["ocean", "deep sea", "underwater"],
    phases: [
      { name: "Surface Zone", turns: "2-3", goal: "What lives near the top? Sunlight zone creatures and coral reefs", generateImage: true, imagePromptHint: "a colorful coral reef teeming with tropical fish and sea turtles, bright underwater illustration for kids" },
      { name: "Going Deeper", turns: "3-4", goal: "Twilight zone — less light, weird adaptations, bioluminescence" },
      { name: "The Abyss", turns: "3-4", goal: "Deep sea monsters! Anglerfish, giant squid, tube worms at vents", generateImage: true, imagePromptHint: "deep sea creatures in the dark ocean — glowing anglerfish, giant squid, hydrothermal vents, mysterious underwater illustration" },
      { name: "Your Submarine", turns: "3-4", goal: "Design a sub that can survive the pressure — how deep can you go?" },
      { name: "Discovery Report", turns: "1-2", goal: "What's your biggest discovery? Present your expedition findings", generateImage: true, imagePromptHint: "a futuristic submarine exploring the deepest ocean with spotlights revealing amazing creatures, epic underwater illustration" },
    ],
  },
  {
    id: "comic-book",
    title: "Create a Comic",
    description: "Build a superhero and write their origin story",
    icon: "💥",
    category: "Writing",
    color: "from-pink-500 to-rose-500",
    prompt: "I want to create a comic book superhero! Help me build their story and powers.",
    keywords: ["comic", "superhero"],
    phases: [
      { name: "Origin Story", turns: "2-3", goal: "Who is your hero? How did they get their powers?", generateImage: true, imagePromptHint: "a superhero origin moment — dramatic transformation scene with energy and light, comic book style illustration for kids" },
      { name: "Powers & Weakness", turns: "3-4", goal: "What can they do? Every hero needs a weakness too!" },
      { name: "The Villain", turns: "3-4", goal: "Create the nemesis — what makes them dangerous and interesting?", generateImage: true, imagePromptHint: "a dramatic face-off between a superhero and villain, comic book panel style with bold colors" },
      { name: "The Showdown", turns: "3-4", goal: "Write the big battle scene — how does the hero win?" },
      { name: "Issue #1 Cover", turns: "1-2", goal: "Describe your comic cover and write the back-cover summary", generateImage: true, imagePromptHint: "a professional comic book cover with the superhero in action pose, bold title and dramatic composition for kids" },
    ],
  },
  {
    id: "bridge-builder",
    title: "Bridge Builder",
    description: "Engineer a bridge that can hold a truck",
    icon: "🌉",
    category: "Engineering",
    color: "from-gray-500 to-slate-500",
    prompt: "I want to design a bridge! Help me figure out how to make it super strong.",
    keywords: ["bridge"],
    phases: [
      { name: "The Challenge", turns: "2-3", goal: "Where is your bridge? How long, what crosses it?", generateImage: true, imagePromptHint: "a scenic landscape with a river gap where a bridge needs to be built, architectural concept sketch for kids" },
      { name: "Bridge Types", turns: "3-4", goal: "Beam, arch, suspension, cable-stayed — which design and why?" },
      { name: "Materials & Forces", turns: "3-4", goal: "Tension, compression, load — what materials handle what forces?", generateImage: true, imagePromptHint: "a bridge blueprint showing force arrows for tension and compression, colorful engineering diagram for kids" },
      { name: "Stress Test", turns: "3-4", goal: "What breaks it? Wind, earthquakes, heavy trucks — make it survive!" },
      { name: "Grand Opening", turns: "1-2", goal: "Name your bridge and present the final design specs", generateImage: true, imagePromptHint: "a magnificent completed bridge with ribbon cutting ceremony, cars crossing, epic architectural illustration for kids" },
    ],
  },
  {
    id: "time-travel",
    title: "Time Traveler",
    description: "Visit any era in history and see what life was like",
    icon: "⏰",
    category: "Explore",
    color: "from-violet-500 to-fuchsia-500",
    prompt: "I want to time travel! Let's pick a time period and explore what life was like.",
    keywords: ["time travel", "history"],
    phases: [
      { name: "Pick Your Era", turns: "2-3", goal: "When do you want to go? Dinosaurs, Ancient Egypt, Medieval, Future?", generateImage: true, imagePromptHint: "a magical time portal with swirling colors showing different historical eras, fantasy illustration for kids" },
      { name: "Arrival Day", turns: "3-4", goal: "You just arrived — what do you see, hear, smell? Who do you meet?" },
      { name: "Daily Life", turns: "3-4", goal: "What do people eat, wear, do for fun? How different is it?", generateImage: true, imagePromptHint: "a bustling scene from a historical era with people in period clothing, markets and buildings, vivid illustration for kids" },
      { name: "Big Event", turns: "3-4", goal: "Witness a major historical event — what happens and how does it change things?" },
      { name: "Time Traveler's Journal", turns: "1-2", goal: "Write your journal entry — what surprised you most? Would you stay?", generateImage: true, imagePromptHint: "an open journal with sketches and notes from a time travel adventure, with a time machine in the background, whimsical illustration" },
    ],
  },
];

export function detectProject(firstMessage: string): Project | null {
  const lower = firstMessage.toLowerCase();
  for (const project of PROJECTS) {
    if (project.keywords.some((kw) => lower.includes(kw))) {
      return project;
    }
    if (lower.includes(`${project.id} project`)) {
      return project;
    }
  }
  return null;
}

export function getCurrentPhase(project: Project, turnCount: number): { phase: ProjectPhase; index: number; turnsInPhase: number } {
  let currentPhase = 0;
  let turnsUsed = 0;

  for (let i = 0; i < project.phases.length; i++) {
    const maxTurns = parseInt(project.phases[i].turns.split("-")[1]);
    if (turnsUsed + maxTurns >= turnCount) {
      currentPhase = i;
      break;
    }
    turnsUsed += maxTurns;
    if (i === project.phases.length - 1) currentPhase = i;
  }

  return {
    phase: project.phases[currentPhase],
    index: currentPhase,
    turnsInPhase: turnCount - turnsUsed,
  };
}

export function buildProjectGuide(project: Project, turnCount: number): string {
  const { phase, index: currentPhase, turnsInPhase } = getCurrentPhase(project, turnCount);
  const maxPhraseTurns = parseInt(phase.turns.split("-")[1]);
  const nearPhaseEnd = turnsInPhase >= maxPhraseTurns - 1;

  let guide = `\n## PROJECT MODE: ${project.title.toUpperCase()}
You are guiding the kid through a structured project. This is NOT free chat.

### Project Roadmap:
${project.phases.map((p, i) => `${i === currentPhase ? "👉" : "  "} Phase ${i + 1}: **${p.name}** (${p.turns} turns) — ${p.goal}`).join("\n")}

### Current Phase: ${currentPhase + 1}/${project.phases.length} — "${phase.name}"
**Goal:** ${phase.goal}
**Turns in this phase so far:** ${turnsInPhase}

### CRITICAL RULES FOR PROJECT MODE:
1. **Stay focused on the current phase goal.** Don't dive into micro-details that belong in later phases.
2. **Keep the big picture visible.** Remind the kid where they are: "Great, we've got the [X] figured out! Next up is [Y]."`;

  if (nearPhaseEnd && currentPhase < project.phases.length - 1) {
    const nextPhase = project.phases[currentPhase + 1];
    guide += `
3. **TIME TO TRANSITION!** You've spent enough turns on "${phase.name}". In your next response:
   - Summarize what the kid decided in this phase (1 sentence)
   - Get excited about the next phase: "Ready for the next part? Now we get to: ${nextPhase.name}!"
   - Ask if they want to move on or keep tweaking current phase
   - If they say anything that moves forward, go to Phase ${currentPhase + 2}`;
  }

  if (currentPhase === project.phases.length - 1) {
    guide += `
3. **FINAL PHASE!** Help the kid wrap up and present their completed project. Celebrate their work!`;
  }

  guide += `
4. **Never spend more than ${maxPhraseTurns} turns on one phase** without offering to move on.
5. **After every 3-4 turns**, briefly show progress: "So far we've done [X], [Y]. Next: [Z]!"
6. **The kid drives decisions**, but YOU drive the structure. If they go off-track, gently redirect: "Love that idea! Let's save it for Phase [N]. Right now let's nail down [current goal]."
7. **IMAGES:** The system automatically generates fun images at key phase transitions. You do NOT need to generate images yourself. If a kid asks for an image, tell them: "An image is coming at the end of this phase — keep going and you'll see it! 🎨" Never say you can't create images.`;

  return guide;
}
