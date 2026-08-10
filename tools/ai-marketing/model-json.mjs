function firstBalancedJsonObject(value = '') {
  const text = String(value);
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (start < 0) {
      if (character === '{') {
        start = index;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return '';
}

export function parseModelJson(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const extracted = firstBalancedJsonObject(cleaned);
  const candidates = [...new Set([cleaned, extracted].filter(Boolean))];
  let lastError;

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('top-level value is not an object');
      }
      return parsed;
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError?.message ? ` (${lastError.message})` : '';
  throw new Error(`model did not return a valid JSON object${detail}`);
}
