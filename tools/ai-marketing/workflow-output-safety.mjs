export function assertWorkflowOutput(name, value) {
  const text = String(value);
  if (!/^[a-z_]+$/.test(name) || /[\r\n\0]/.test(text)) throw new Error('Unsafe workflow output');
  if (!text) return text;
  if (name === 'files') {
    for (const file of text.split(',')) {
      if (!/^public\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.html$/.test(file)) throw new Error('Unsafe public HTML filename');
    }
  } else if (['url', 'target_url', 'source_url', 'source_urls'].includes(name)) {
    for (const value of text.split(',')) {
      let url;
      try { url = new URL(value); } catch { throw new Error('Unsafe production URL'); }
      if (url.origin !== 'https://youraicoach.life' || url.username || url.password || url.search || url.hash
        || !/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*(?:\.html)?\/?$/.test(url.pathname)) {
        throw new Error('Unsafe production URL');
      }
    }
  } else if (name === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text)) {
    throw new Error('Unsafe publication slug');
  }
  return text;
}
