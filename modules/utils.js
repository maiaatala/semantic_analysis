/**
 * @param {string} str - a string
 * @returns {string | undefined}
 */
export function removeWhiteSpace(str) {
  if (!str || typeof str !== 'string') return undefined;
  return str.replace(/\s/g, '');
}

/**
 * @param {string} str - a string
 * @param {string} char1 - first character
 * @param {string} char2 - second character
 * @returns {string[] | undefined}
 */
export function separateStringByCharacters(str, char1, char2) {
  if (!str || typeof str !== 'string') return undefined;
  const match = str.match(/<([^>]+)>\s*(\S.*)/);
  if (!match) return [str.match(/<([^>]+)>/)[1]];
  return match?.splice(1);
}
