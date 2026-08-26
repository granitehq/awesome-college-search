import { readFile } from 'node:fs/promises';

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const linkPattern = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g;
const seen = new Map();
const duplicates = [];

function normalize(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = '';

  for (const parameter of [...url.searchParams.keys()]) {
    if (parameter.startsWith('utm_')) {
      url.searchParams.delete(parameter);
    }
  }

  url.hostname = url.hostname.toLowerCase();
  if (url.pathname !== '/') {
    url.pathname = url.pathname.replace(/\/$/, '');
  }

  return url.toString();
}
for (const match of readme.matchAll(linkPattern)) {
  const rawUrl = match[1];
  const normalizedUrl = normalize(rawUrl);
  const line = readme.slice(0, match.index).split('\n').length;
  const first = seen.get(normalizedUrl);

  if (first) {
    duplicates.push({ first, line, rawUrl });
  } else {
    seen.set(normalizedUrl, { line, rawUrl });
  }
}

if (duplicates.length > 0) {
  console.error('Duplicate README links found:');
  for (const duplicate of duplicates) {
    console.error(
      `- ${duplicate.rawUrl} on line ${duplicate.line} duplicates line ${duplicate.first.line}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(`Checked ${seen.size} unique README links; no duplicates found.`);
}
