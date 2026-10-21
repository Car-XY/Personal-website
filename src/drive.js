export const EXITS = [
  { id: 'projects', number: '01', title: 'Projects', subtitle: 'Ideas, built into reality', km: '1.2' },
  { id: 'teams', number: '02', title: 'Design Teams', subtitle: 'Code that moves cars', km: '2.4' },
  { id: 'journey', number: '03', title: 'The Journey', subtitle: 'The road so far', km: '3.6' },
  { id: 'skills', number: '04', title: 'Under the Hood', subtitle: 'My technical toolkit', km: '4.8' },
  { id: 'contact', number: '05', title: 'Let’s Connect', subtitle: 'The next adventure', km: '6.0' },
];

export function speedAt(elapsed, duration = 5800) {
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  return Math.round(180 * (1 - (1 - progress) ** 2));
}

export function gearAt(speed) {
  if (speed === 0) return 'P';
  return Math.min(6, Math.floor(speed / 34) + 1);
}

export function rpmAt(speed, rev = 0) {
  return Math.min(8500, 1100 + (speed % 34) * 125 + Math.min(speed, 160) * 11 + rev * 4200);
}
