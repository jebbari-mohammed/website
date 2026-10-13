import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Download } from 'lucide-react';
import { getDownloadPlatform, getDownloadUrl, type DownloadPlatform } from '../lib/store-download';
import './StoreDownloadButton.css';

export default function StoreDownloadButton() {
  const [target, setTarget] = useState<Element | null>(null);
  const platform: DownloadPlatform = typeof navigator === 'undefined' ? 'other' : getDownloadPlatform(navigator.userAgent, navigator.platform);

  useEffect(() => {
    // Resolve the portal after the opening section has committed its DOM.
    const frame = requestAnimationFrame(() => setTarget(document.querySelector('#opening-film .opening-film__bar')));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!target) return null;
  const destination = platform === 'apple' ? 'the App Store' : platform === 'android' ? 'Google Play' : 'your app store';

  return createPortal(
    <a
      className="store-download-button"
      data-izem-download="true"
      data-download-platform={platform}
      href={getDownloadUrl(platform)}
      aria-label={`Download IZEM from ${destination}`}
    >
      <Download size={17} aria-hidden="true" />
      <span>Download IZEM</span>
      <ArrowUpRight className="store-download-button__arrow" size={17} aria-hidden="true" />
    </a>,
    target,
  );
}
