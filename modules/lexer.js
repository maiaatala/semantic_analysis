import { displayResults } from '../index.js';
import { END_OF_LINE, END_OF_WORD, IF_STATE, REGEX, TYPES, TYPE_VARIATIONS } from './lexer.contants.js';
import { handleComments, handleConstDeclaration, handleImportDeclaration } from './lexer.functions.js';

/**
 * @typedef {Object} TVariableTracker
 * @property {string} name - The name of the variable.
 * @property {TYPES} type - The type of the variable.
 */

/**
 * @typedef {Object} TFunctionTracker
 * @property {string} name - The name of the variable.
 * @property {TYPES} type - The type of the return of the function
 * @property {TYPES[]} params - The type of the parameters of the function
 */

/**
 * @typedef {string[]} TImportTracker
 */

/**
 * @param {string} lineText - a line content
 * @returns {Generator<string>}
 */
export function* iterateLine(iterable) {
  let i = -1;
  let currentWord = '';

  for (const character of iterable) {
    i++;
    if (END_OF_LINE.includes(character) || END_OF_WORD.includes(character)) {
      if (currentWord === '') continue; //wont return empty words
      yield currentWord;
      currentWord = '';
    }

    if (character === '/' && (iterable[i + 1] === '/' || iterable[i + 1] === '*')) {
      if (currentWord !== '') {
        yield currentWord; // return if there's something before the comment
      }
      // line is a comment, return it all
      yield iterable.slice(i);
      break;
    }
    currentWord = currentWord + character;
  }

  yield currentWord;
}

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
    //use this to iterate over each line
    if (firstWord === '#include') {
      const maybeNewImport = handleImportDeclaration({ allImports: declaredImports, currLine: lineText, currLineNum: lineNumber });
      if (maybeNewImport) {
        declaredImports.push(maybeNewImport);
      }
    }
    if (firstWord === '#define') {
      const maybeNewConst = handleConstDeclaration({ allVariables: globalVariables, currLine: lineText, currLineNum: lineNumber });
      if (maybeNewConst) {
        globalVariables.push(maybeNewConst);
      }
    }
    if ([...TYPES, ...TYPE_VARIATIONS].includes(firstWord)) {
      displayResults({ lineNumber, lineText, result: 'function/declaration', isError: false });
      //handleConstDeclaration({ allImports: declaredImports });
    }

    if (firstWord?.startsWith('//') || firstWord?.startsWith('/*')) {
      handleComments({ generator: lineGenerator, currLine: lineText, currLineNum: lineNumber });
    }
  }

  console.log('globalVariables', globalVariables);
  console.log('declaredImports', declaredImports);
  console.log('declaredFunctions', declaredFunctions);
}

/**
 * @param {Object} Generator<TGeneratorReturn>
 * @param {TVariableTracker[]} globalVariables -  global variables
 * @param {TFunctionTracker[]} alreadyDeclaredFunctions - all functions
 * @returns TFunctionTracker
 */
function handleFunctionDeclaration({ generator, allVariables }) {
  //analyse if the function has a name already declared
  const bracketStack = [];

  //iterates over the function until bracket stack is empty
  //return TFunctionTracker if it was not declared
}
