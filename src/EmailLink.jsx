import { useEffect, useRef, useState } from 'react';
import { links } from './data.js';

// A mailto: link does nothing on computers without a mail app set up (common with web mail),
// so the link also copies the address and says so. Either way the visitor gets the address.
export default function EmailLink({ className = 'plain-link', children = 'Email me' }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = () => {
    navigator.clipboard?.writeText(links.email).then(() => {
      setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 3500);
    }, () => {});
  };
  return <span className="email-link">
    <a className={className} href={`mailto:${links.email}`} onClick={copy}>{children}</a>
    <span className={`email-copied ${copied ? 'is-shown' : ''}`} role="status">{copied && <>Address copied: <strong>{links.email}</strong></>}</span>
  </span>;
}
