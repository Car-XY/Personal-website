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
    detail:'Work for U of T Formula Racing’s Driverless team and Blue Sky Solar Racing. Team-owned source repositories are not linked publicly.',
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
    title:'Anchor',kind:'PRODUCTIVITY × DESKTOP',year:'2026',visual:'anchor',status:'Prototype',
    description:'Desktop habit tracker: daily check-ins, streaks, goal tracking. Flask + Electron. It is currently under complete revamping. Many more additional features to come!',
    contributions:['Built the Flask and SQLite habit, reflection and timeline backend.','Packaged the local application with Electron.'],
    outcome:'3 core workflows: habits, reflections and a goal timeline',
    note:'CS50 final project.',
    detail:'The goal timeline combines dated habit logs and reflections. The desktop version runs the Flask backend on the user’s own machine.',
    tags:['Flask','Electron','SQLite'],
    links:[{label:'GitHub',href:'https://github.com/Car-XY/Final-Project-CS50'}],
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
