/**
 * @param {string} str - a string
 * @returns {string | undefined}
 */
export function removeWhiteSpace(str) {
  if (!str || typeof str !== 'string') return undefined;
  return str.replace(/\s/g, '');
}

/**
 * @param {string} str - a line
 * @returns {string}
 */
function removeComment(str) {
  if (!str || typeof str !== 'string') return undefined;
  return str.split('//')[0].split('//*')[0];
}

/**
 * @param {string} str - a string
 * @returns {string[] | undefined}
 */
export function separateStringByCharacters(str) {
  str = removeComment(str);
  if (!str || typeof str !== 'string') return undefined;
  const match = str.match(/<([^>]+)>\s*(\S.*)/);
  if (!match) return [str.match(/<([^>]+)>/)[1]];
  return match?.splice(1)?.filter(Boolean);
}

/**
 * @param {string} str - a string
 * @returns {string[] | undefined}
 */
export function splitOnWhitespace(str) {
  str = removeComment(str);
  if (!str || typeof str !== 'string') return undefined;
  return str.split(/\s+/)?.filter(Boolean);
}
