export const links = {
  email:'carycx.li@mail.utoronto.ca', github:'https://github.com/Car-XY',
  linkedin:'https://www.linkedin.com/in/cary-li-4815642b1/', devpost:'https://devpost.com/Car-XY',
};
export const availability = "I'm looking for Summer 2027 internships! (or just a good conversation about building things😉)";
export const currently = "Currently working on developing a lightweight CNN that can use sensor fusion to detect cone colour and position for UTFR's DV team.";

export const projects = [
  {
    title:'Kera',kind:'HEALTHCARE × MACHINE LEARNING',year:'2026',visual:'kera',status:'Live',
    description:'Photo-based hemoglobin estimation from fingernail images. Ensemble of 3 neural nets on 42 colour features.',
    contributions:['Trained and evaluated the PyTorch ensemble.','Built the colour-feature preprocessing and inference pipeline.'],
    outcome:'15.96 g/L MAE on 50 held-out patients',
    note:'Built in 36 hours at Hack the Valley 11. Experimental — not a diagnostic.',
    detail:'Three-seed MLP ensemble, training-only five-fold grouped cross-validation and a separate held-out patient cohort. These research results do not establish clinical accuracy.',
    tags:['Python','PyTorch','scikit-learn'],
    links:[{label:'Live app',href:'https://www.keracare.health/'},{label:'GitHub',href:'https://github.com/OlivierA-Y/kera'}],
  },
  {
    title:'ClearPath',kind:'SPATIAL DESIGN × WEB',year:'2026',visual:'clearpath',status:'Prototype',
    description:'Browser-based 3D room planner with synchronized 3D and top-down views. Drag-and-drop furniture, real-time Three.js rendering.',
    contributions:['Built the coordinated 3D and top-down editing workflow.','Implemented furniture editing and geometric route and clearance checks.'],
    outcome:'2 synchronized views of the same room',
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
  {
    title:'Racing Algorithms',kind:'AUTONOMY × RACE STRATEGY',year:'2026',visual:'racing',status:'In development',
    description:'C++ pathfinding that converts cone maps into racing lines for a driverless Formula car, plus energy-use simulation for solar race strategy.',
    contributions:['Develop C++ pathfinding that optimizes path length and straightness.','Simulate solar-car energy use, with local caching to accelerate the search.'],
    outcome:'Algorithms for 2 university racing programs',
    note:'Source code is private.',
    detail:'Work for U of T Formula Racing’s Driverless team and Blue Sky Solar Racing. Team-owned source repositories are not linked publicly.',
    tags:['C++','Pathfinding','Simulation'],privateSource:true,
    links:[{label:'Formula team',href:'https://fsaeutoronto.ca'},{label:'Solar team',href:'https://www.blueskysolar.org/'}],
  },
];
export const skills = [
  {name:'Machine learning',number:'01',items:['Python','PyTorch','scikit-learn','Computer vision']},
  {name:'Web & app development',number:'02',items:['TypeScript / JavaScript','React / Next.js','Three.js','Flask','SQLite / SQL','Electron','HTML / CSS']},
  {name:'Engineering & algorithms',number:'03',items:['C++ / C','Java / C#','Pathfinding','Energy simulation','Git']},
];
