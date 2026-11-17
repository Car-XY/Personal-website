// A small King's Highway–style route marker beside the name.
export default function Wordmark() {
  return <a className="wordmark" href="/" aria-label="Cary Li, home">
    <svg className="wordmark-shield" viewBox="0 0 40 45" aria-hidden="true">
      <path d="M2.5 9Q20 4 37.5 9V28Q36 40 20 43.5Q4 40 2.5 28Z" fill="#f4f3ee" stroke="currentColor" strokeWidth="2"/>
      <path d="M13 9.5V5.5L16.5 7.5 20 3.5 23.5 7.5 27 5.5V9.5Z" fill="currentColor"/>
      <text x="20" y="31" textAnchor="middle" fontFamily="Overpass, sans-serif" fontWeight="800" fontSize="15" fill="currentColor">CL</text>
    </svg>
    <span>Cary Li</span>
  </a>;
}
