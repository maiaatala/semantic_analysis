import { displayResults } from '../index.js';
import { TYPES, TYPE_VARIATIONS } from './lexer.contants.js';
import { removeWhiteSpace, separateStringByCharacters, splitOnWhitespace } from './utils.js';

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
 * @param generator {Object} Generator<TGeneratorReturn>
 * @param currLine {string} - current line
 * @param currLineNum {number} - current line number
 * @returns {void}
 */
export function handleComments({ generator, currLine, currLineNum }) {
  if (currLine.startsWith('//')) {
    // line is a comment, ignore
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'valid comment', isError: false });
    return;
  }

  if (currLine.startsWith('/*')) {
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'valid comment', isError: false });
    if (currLine.endsWith('*/')) {
      // line is a comment, ignore
      return;
    }
    //find where the comment block ends
    while (true) {
      const { lineText, lineNumber } = generator.next().value;
      if (lineText?.includes('*/')) {
        //found the end of the comment
        //verify if the line ends with the end of the comment
        if (removeWhiteSpace(lineText)?.endsWith('*/')) {
          displayResults({ lineNumber, lineText, result: 'valid end of comment block', isError: false });
          return;
        }

        displayResults({ lineNumber, lineText, result: "ERROR: there's text after the end of the coment block", isError: true });
        return;
      }
      displayResults({ lineNumber, lineText, result: 'line is part of a comment block', isError: false });
    }
  }
}

/**
 * @param {TImportTracker} allImports - already declared imports
 * @param {string} currLine - current line
 * @param {number} currLineNum - current line number
 * @returns string | null
 */
export function handleImportDeclaration({ allImports, currLine, currLineNum }) {
  let lineText = currLine;
  const breakImportLine = separateStringByCharacters(currLine, '<', '>')?.filter(Boolean);

  if (!breakImportLine?.length) {
    displayResults({ lineNumber: currLineNum, lineText, result: 'ERROR: no import', isError: true });
    return null;
  }
  if (breakImportLine.length > 1) {
    displayResults({ lineNumber: currLineNum, lineText, result: 'ERROR: too many imports', isError: true });
    return null;
  }
  //analyse if the import was already declared
  if (allImports.includes(breakImportLine[0])) {
    displayResults({ lineNumber: currLineNum, lineText, result: 'ERROR: import already declared', isError: true });
    return null;
  }

  displayResults({ lineNumber: currLineNum, lineText, result: 'valid import', isError: false });
  return breakImportLine[0];
}

/**
 * @param {TVariableTracker} allVariables - already declared variables
 * @param {string} currLine - current line
 * @param {number} currLineNum - current line number
 * @returns TVariableTracker | null
 */
export function handleConstDeclaration({ allVariables, currLine, currLineNum }) {
  let lineText = currLine;
  const breakConstLine = splitOnWhitespace(currLine)?.filter(Boolean);

  if (!breakConstLine?.length) {
    displayResults({ lineNumber: currLineNum, lineText, result: 'ERROR: no declaration', isError: true });
    return null;
  }
  if (breakConstLine.length !== 3) {
    displayResults({ lineNumber: currLineNum, lineText, result: 'ERROR: wrong const syntax', isError: true });
    return null;
  }
  //analyse if the const was already declared
  if (allVariables?.includes(breakConstLine[1])) {
    displayResults({ lineNumber: currLineNum, lineText, result: 'ERROR: const already declared', isError: true });
    return null;
  }

  const maybeNumber = parseFloat(breakConstLine[2]);

  displayResults({ lineNumber: currLineNum, lineText, result: 'valid import', isError: false });
  return {
    name: breakConstLine[1],
    type: Number.isNaN(maybeNumber) ? 'char' : Number.isInteger(maybeNumber) ? 'int' : 'float',
  };
}

/**
 * @param {Object} Generator<TGeneratorReturn>
 * @param {TVariableTracker[]} globalVariables -  global variables
 * @param {TFunctionTracker[]} alreadyDeclaredFunctions - all functions
 * @returns TFunctionTracker
 */
function handleFunctionDeclaration({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];

  let returnType = '';
  let functionName = '';
  let params = [];

  //first line is the function declaration
  for (const word of iterateLine(currLine)) {
    if (TYPE_VARIATIONS.includes(word)) {
      continue;
    }
    if (!returnType && TYPES.includes(word)) {
      returnType = word;
      continue;
    }

    if (word === '(') {
      bracketStack.push('(');
      continue;
    }

    if (word === ')') {
      //function param block did not start. too early end )
      bracketStack.pop();
      continue;
    }

    if (bracketStack.length === 1) {
      //we are in the params declaration
      if (word === ',') {
        continue;
      }
      if (word === '{') {
        //function declaration ended early ERROR
        break;
      }
      if (word === ')') {
        //end of params declaration
        bracketStack.pop();
        continue;
      }
      //verify if valid `ALPHABETIC_THEN_ALPHANUMERIC` regex
      params.push(word);
      continue;
    }

    if (!functionName) {
      //verify if valid `ALPHABETIC_THEN_ALPHANUMERIC` regex
      functionName = word;
      continue;
    }
  }
}

function handleIfBlock({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handleSwitchBlock({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handleForLoop({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handleWhileLoop({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handleDoWhileLoop({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handlePrintf({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handleScanf({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handleConstUsage({ generator, allVariables, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}
