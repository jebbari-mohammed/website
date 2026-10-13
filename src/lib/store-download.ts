import storeLinks from '../content/store-links.json';

export type DownloadPlatform = 'apple' | 'android' | 'other';

export function getDownloadPlatform(userAgent: string, platform = ''): DownloadPlatform {
  // Android first: some user agents also include Apple's compatibility wording.
  if (/android/i.test(userAgent) || /android/i.test(platform)) return 'android';
  // iPadOS desktop mode reports Macintosh; it belongs on the Apple destination.
  if (/iphone|ipad|ipod|macintosh|mac os x/i.test(userAgent) || /^mac/i.test(platform)) return 'apple';
  return 'other';
}

export function getDownloadUrl(platform: DownloadPlatform): string {
  return platform === 'apple' ? storeLinks.apple : platform === 'android' ? storeLinks.google : '/download/';
}
