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
    description:'Desktop habit tracker: daily check-ins, streaks, goal tracking. Flask + Electron.',
    contributions:['Built the Flask and SQLite habit, reflection and timeline backend.','Packaged the local application with Electron.'],
    outcome:'3 core workflows: habits, reflections and a goal timeline',
    note:'CS50 final project. A web demo is also available.',
    detail:'The goal timeline combines dated habit logs and reflections. The desktop version runs the Flask backend on the user’s own machine.',
    tags:['Flask','Electron','SQLite'],
    links:[{label:'Web demo',href:'https://anchor-productivity.up.railway.app/'},{label:'GitHub',href:'https://github.com/Car-XY/Final-Project-CS50'}],
  },
];
export const skills = [
  {name:'Machine learning',number:'01',items:['Python','PyTorch','scikit-learn','Computer vision']},
  {name:'Web & app development',number:'02',items:['TypeScript / JavaScript','React / Next.js','Three.js','Flask','SQLite / SQL','Electron','HTML / CSS']},
  {name:'Engineering & algorithms',number:'03',items:['C++ / C','Java / C#','Pathfinding','Energy simulation','Git']},
];
