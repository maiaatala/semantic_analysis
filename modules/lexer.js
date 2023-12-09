import { displayResults } from '../index.js';
import { TYPES, TYPE_VARIATIONS } from './lexer.contants.js';
import { handleComments, handleConstDeclaration, handleFunctionDeclaration, handleImportDeclaration, iterateLine } from './lexer.functions.js';

/**
 * @typedef {Object} TVariableTracker
 * @property {string} name - The name of the variable.
 * @property {TYPES[number]} type - The type of the variable.
 */

/**
 * @typedef {Object} TFunctionTracker
 * @property {string} functionName - The name of the variable.
 * @property {TYPES} type - The type of the return of the function
 * @property {TYPES[number][]} params - The type of the parameters of the function
 */

/**
 * @typedef {string[]} TImportTracker
 */

/**
 * @typedef {Object} TGeneratorReturn
 * @property {string} lineText - the line content
 * @property {number} lineNumber - line number, starting from 0
 */

/**
 * @param {string} fileContent - a file content
 * @returns {Generator<TGeneratorReturn>}
 */
function* iterateFile(fileContent) {
  const allLines = fileContent.split('\n');

  let i = 0;
  for (const lineText of allLines) {
    yield { lineText, lineNumber: i };
    i++;
  }
}

export function analyzeSemantics(fileContent) {
  /**
   * when saved to a const, generators will save their internal state
   * as long as we use the same `lineGenerator` we will always get the next line
   */
  const lineGenerator = iterateFile(fileContent);

  /** @type {TVariableTracker[]} */
  const globalVariables = [];
  /** @type {TFunctionTracker[]} */
  const declaredFunctions = [];
  /** @type {TImportTracker[]} */
  const declaredImports = [];

  for (const { lineText, lineNumber } of lineGenerator) {
    const firstWord = iterateLine(lineText).next().value;
    if (!lineText || !firstWord) continue;
    //use this to iterate over each line
    if (firstWord === '#include') {
      const maybeNewImport = handleImportDeclaration({ allImports: declaredImports, currLine: lineText, currLineNum: lineNumber });
      if (maybeNewImport) {
        declaredImports.push(maybeNewImport);
      }
      continue;
    }
    if (firstWord === '#define') {
      const maybeNewConst = handleConstDeclaration({ allVariables: globalVariables, currLine: lineText, currLineNum: lineNumber });
      if (maybeNewConst) {
        globalVariables.push(maybeNewConst);
      }
      continue;
    }
    if ([...TYPES, ...TYPE_VARIATIONS].includes(firstWord)) {
      const maybeNewFunction = handleFunctionDeclaration({
        generator: lineGenerator,
        globalFunctions: declaredFunctions,
        globalVariables,
        currLine: lineText,
        currLineNum: lineNumber,
      });
      if (maybeNewFunction) {
        declaredFunctions.push(maybeNewFunction);
      }
      continue;
    }

    if (firstWord?.startsWith('//') || firstWord?.startsWith('/*')) {
      handleComments({ generator: lineGenerator, currLine: lineText, currLineNum: lineNumber });
      continue;
    }

    displayResults({ lineNumber, lineText, result: 'code outside a function block', isError: true });
  }

  console.log('globalVariables', globalVariables);
  console.log('declaredImports', declaredImports);
  console.log('declaredFunctions', declaredFunctions);
}
