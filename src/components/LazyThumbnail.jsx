import { useEffect, useState } from 'react';
import './LazyThumbnail.css';

export function thumbnailUrl(src) {
  if (!src || !src.startsWith('/uploads/') || src.startsWith('/uploads/thumbs/')) return src;
  const filename = src.split('/').pop()?.split(/[?#]/)[0] || '';
  const basename = filename.replace(/\.[^.]+$/, '');
  return basename ? `/uploads/thumbs/${basename}.webp` : src;
}

export default function LazyThumbnail({ src, alt = '', className = '', ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(() => thumbnailUrl(src));
  useEffect(() => { setLoaded(false); setResolvedSrc(thumbnailUrl(src)); }, [src]);
  return <img {...props} src={resolvedSrc} alt={alt} loading="lazy" decoding="async"
    className={`lazy-thumbnail ${loaded ? 'is-loaded' : ''} ${className}`.trim()}
    onLoad={() => setLoaded(true)}
    onError={() => { if (resolvedSrc !== src) setResolvedSrc(src); else setLoaded(true); }} />;
}
