export const links = {
  email: 'carycx.li@mail.utoronto.ca',
  github: 'https://github.com/Car-XY',
  linkedin: 'https://www.linkedin.com/in/cary-li-4815642b1/',
  devpost: 'https://devpost.com/Car-XY',
};

export const projects = [
  {
    title: 'Kera', kind: 'HEALTHCARE × MACHINE LEARNING', year: '2026', visual: 'kera',
    description: 'A different lens on everyday care. An experimental, photo-based hemoglobin estimator built at Hack the Valley.',
    detail: 'Trained an ensemble of three PyTorch neural networks using 42 standardized colour features. Five-fold grouped cross-validation and 50 held-out patient records produced a mean absolute error of 15.96 g/L. An experimental research project; clinical validation is still ahead.',
    tags: ['Python', 'PyTorch', 'scikit-learn'], href: 'https://keracare.health', cta: 'Explore Kera',
  },
  {
    title: 'ClearPath', kind: 'SPATIAL DESIGN × WEB', year: '2026', visual: 'clearpath',
    description: 'Make room for better ideas. A browser-based room planner with synchronized 3D and top-down views.',
    detail: 'Combines photo-based room estimates, furniture editing, and A* routing with collision and clearance checks, helping people compare practical layouts before moving a single piece of furniture.',
    tags: ['TypeScript', 'React', 'Three.js'], href: links.github, cta: 'View GitHub',
  },
  {
    title: 'Anchor', kind: 'PRODUCTIVITY × DESKTOP', year: '2026', visual: 'anchor',
    description: 'Small habits. Steady progress. A Windows app for goal tracking, daily check-ins, and a little accountability.',
    detail: 'Built a Flask and SQLite backend, packaged with an Electron interface. OS notifications and an AI assistant prompt progress check-ins and help keep meaningful goals in sight.',
    tags: ['Flask', 'Electron', 'SQLite'], href: links.github, cta: 'View GitHub',
  },
  {
    title: 'Racing Algorithms', kind: 'AUTONOMY × RACE STRATEGY', year: '2026', visual: 'racing',
    description: 'Finding the fastest way forward. Pathfinding and energy strategy for Formula and solar racing.',
    detail: 'Built a cone-based pathfinding algorithm that optimizes path length and straightness for Formula Racing. Simulated solar-car energy use to search for efficient racing speeds, using local caching to accelerate the search.',
    tags: ['C++', 'Path planning', 'Simulation'], href: links.github, cta: 'View GitHub',
  },
];

export const skills = [
  { name: 'Machine learning', number: '01', subtitle: 'FROM DATA TO INSIGHT', items: ['Python', 'PyTorch', 'scikit-learn', 'Computer vision', 'Neural network ensembles', 'Model evaluation'] },
  { name: 'Full-stack development', number: '02', subtitle: 'FROM IDEA TO INTERFACE', items: ['TypeScript / JavaScript', 'React / Next.js', 'Three.js', 'Flask', 'SQLite / SQL', 'Electron', 'HTML / CSS'] },
  { name: 'Engineering & algorithms', number: '03', subtitle: 'FROM LOGIC TO MOTION', items: ['C++ / C', 'Java / C#', 'Pathfinding', 'Energy simulation', 'Git', 'Rapid prototyping'] },
];
