export const links = {
  email:'carycx.li@mail.utoronto.ca', github:'https://github.com/Car-XY',
  linkedin:'https://www.linkedin.com/in/cary-li-4815642b1/', devpost:'https://devpost.com/Car-XY',
};
export const availability = "I'm looking for Summer 2027 internships! (or just a good conversation about building things😉)";
export const currently = 'Currently developing a lightweight CNN that uses LiDAR intensity values to identify cone colour and position.';

export const projects = [
  {
    title:'Kera',kind:'HEALTHCARE × MACHINE LEARNING',year:'2026',visual:'kera',status:'Live',
    description:'Estimates hemoglobin levels from fingernail images using a colour-based ensemble of three neural networks and 42 colour features. Includes AI-assisted skin-disease detection.',
    contributions:['Trained and evaluated the PyTorch ensemble.','Built the colour-feature preprocessing and inference pipeline.'],
    outcome:'About 16 g/L mean absolute error on study data',
    note:'Built in 36 hours at Hack the Valley 11. Still in testing.',
    detail:'Three-seed MLP ensemble. The error figure is an aggregate result on study data, not an independent clinical validation.',
    tags:['Python','PyTorch','scikit-learn'],
    links:[{label:'Live app',href:'https://www.keracare.health/'},{label:'GitHub',href:'https://github.com/OlivierA-Y/kera'},{label:'Devpost',href:'https://devpost.com/software/kera'},{label:'Research paper',href:'https://www.nature.com/articles/s41597-024-03895-9'}],
  },
  {
    title:'Racing Algorithms',kind:'AUTONOMY × RACE STRATEGY',year:'2026',visual:'racing',status:'In development',
    description:'C++ pathfinding that converts cone maps into racing lines for a driverless Formula car, plus energy-use simulation for solar race strategy.',
    contributions:['UTFR: Building cone-colour detection as a core part of the perception pipeline for a 3D map of the car’s surroundings.','Blue Sky Solar: Developing an accurate energy simulator for Blue Sky’s Gen 13 car.'],
    outcome:'Algorithms for 2 university racing programs',
    note:'Source code is private.',
    notes:[
      {heading:'UTFR · LiDAR cone classifier',points:[
        'Replaces the LiDAR pipeline’s hand-tuned cone check with an XGBoost model that scores each point cluster as cone or not-cone.',
        'Training data comes from replaying raw LiDAR recordings through the car’s own C++ clustering code.',
        'The camera CNN labels everything first, then I review all of them again by hand.',
        'About 25 features per cluster, covering size, shape, taper and height above the ground.',
      ]},
      {heading:'Blue Sky Solar · Simulator documentation',points:[
        'Documenting the energy simulator’s code to break earlier years’ habit of leaving it unexplained, so new members can understand it and build on it.',
      ]},
    ],
    tags:['C++','Perception','Simulation'],privateSource:true,
    links:[{label:'Formula team',href:'https://fsaeutoronto.ca'},{label:'Solar team',href:'https://www.blueskysolar.org/'}],
  },
  {
    title:'ClearPath',kind:'SPATIAL DESIGN × WEB',year:'2026',visual:'clearpath',status:'Prototype',
    description:'A browser-based 3D room planner with synchronized 3D and top-down views, drag-and-drop furniture, and real-time Three.js rendering.',
    contributions:['Built-in sunlight simulator with a realistic heat map to find the best napping spots.','Add your favourite furniture from IKEA or Walmart, and ClearPath generates a 3D model of it in your room.'],
    outcome:'Explore your room in ClearPath’s interactive first-person viewer.',
    note:'Compare furniture layouts before moving anything.',
    detail:'Photo-based room estimates, furniture editing and A* routing with collision and clearance checks. Estimated dimensions need review before making real layout decisions.',
    tags:['TypeScript','React','Three.js'],
    links:[{label:'GitHub',href:'https://github.com/Car-XY/ClearPath'}],
  },
  {
    title:'Anchor 2',kind:'PRODUCTIVITY × DESKTOP',year:'2026',visual:'anchor',status:'Revamped',
    description:'A habit compass: each habit is a ring around the anchor and each segment is one of the last 14 days. Behind it, a live ocean follows your last 7 days, from calm harbour to open water to storm, and an AI companion swims around the screen with tips from your data.',
    contributions:['Rebuilt the frontend from scratch: the SVG habit compass, a WebGL ocean shader with no libraries, and a sky that follows your clock.','Rebuilt the Flask backend with SQLAlchemy models, a JSON API, and pure-Python services for streaks, hold rates and the sea state.','Added an AI companion (via OpenRouter) that reads your habits, logs and reflections and runs an end-of-day Debrief, with local tips when no API key is set.'],
    outcome:'Today, Habits, Reflections, Timeline and Debrief, as a web app or an Electron desktop app',
    note:'A full rebuild of my CS50 final project.',
    detail:'Sea state: holding 75% or more of your due habits over 7 days is a calm harbour, 45–75% is open water, and under 45% is a storm. SQLite locally, Postgres when deployed; services and the API are tested with pytest.',
    tags:['Flask','SQLAlchemy','WebGL','Tailwind','Electron'],
    links:[{label:'GitHub',href:'https://github.com/Car-XY/Anchor/tree/main'}],
  },
];
export const skills = [
  {name:'Machine learning',number:'01',items:['Python','PyTorch','scikit-learn','Computer vision']},
  {name:'Web & app development',number:'02',items:['TypeScript / JavaScript','React / Next.js','Three.js','Flask','SQLite / SQL','Electron','HTML / CSS']},
  {name:'Engineering & algorithms',number:'03',items:['C++ / C','Java / C#','Pathfinding','Energy simulation','Git']},
];

// Your photo appears on the portfolio page only (public/images/cary.jpg, 3:2 landscape). Set ready: false to show the placeholder instead.
export const portrait = { src: '/images/cary.jpg', alt: 'Cary Li in a yellow hard hat and F!rosh shirt, taking a selfie on U of T’s front campus', ready: true, width: 1520, height: 1013 };

export const about = 'I’m a first-year Engineering Science student at the University of Toronto’s St. George campus, aiming for Robotics in third year. I build systems where software meets something physical: a room, a race car, a person’s fingers.';

export const teams = [
  {
    name: 'U of T Formula Racing', group: 'Formula SAE · Driverless', href: 'https://fsaeutoronto.ca',
    image: { src: '/images/teams/utfr-lidar.webp', width: 1200, height: 675, alt: 'LiDAR point cloud with blue and yellow cone detections along a race track' },
    role: 'I’m the project lead for a LiDAR-based machine learning model that detects cones for UTFR’s Classical Perception team.',
    stack: ['ROS 2', 'Foxglove', 'C++', 'LiDAR', 'Neural networks'],
  },
  {
    name: 'Blue Sky Solar Racing', group: 'Solar vehicles · Race strategy', href: 'https://www.blueskysolar.org/', sign: 'bluesky',
    role: 'I’m a junior member of the Energy Simulation team within Blue Sky Solar Racing’s Strategy division, building an energy simulator for the Gen 13 car.',
    stack: ['Energy simulation', 'Race strategy'],
  },
];

export const journey = [
  { when: 'Sep 2026 – present', title: 'University of Toronto', subtitle: 'B.A.Sc. · Engineering Science', text: 'First-year Engineering Science student. Software work with U of T Formula Racing and Blue Sky Solar Racing.' },
  { when: 'Mar 2025 – present', title: 'The Fundamental Why', subtitle: 'Founder · Physics & philosophy podcast', text: 'Conversations with STEM researchers, physics students, and curious minds about how the world works, and why.', link: { label: 'Watch The Fundamental Why', href: 'https://www.youtube.com/@TheFundamentalWhy' }, stats: [['7', 'episodes'], ['2.1k+', 'subscribers'], ['14.1k+', 'views']] },
  { when: 'Sep 2024 – Jun 2026', title: 'Champion Swim School', subtitle: 'Competitive swim instructor', text: 'Taught all four strokes to swimmers aged 6–16. Named Instructor of the Month twice, among a team of 30.' },
  { when: '2022 – 2026', title: 'Dr. G.W. Williams Secondary School', subtitle: 'IB Diploma · 41/45', text: 'UofT National Book Award, Pay It Forward Scholarship, and DECA ICDC qualifier.' },
];
