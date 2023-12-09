import { displayResults } from '../index.js';
import { END_OF_LINE, END_OF_WORD, LOGICAL_OPERATORS, MATH_OPERATORS, REGEX, TYPES, TYPE_VARIATIONS } from './lexer.contants.js';
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
    if (character === '/' && (iterable[i + 1] === '/' || iterable[i + 1] === '*')) {
      if (currentWord !== '') {
        yield currentWord; // return if there's something before the comment
      }
      // line is a comment, return it all
      yield iterable.slice(i);
      break;
    }

    if (
      END_OF_LINE.includes(character) ||
      END_OF_WORD.includes(character) ||
      MATH_OPERATORS.includes(character) ||
      LOGICAL_OPERATORS.includes(character)
    ) {
      if (currentWord === '') continue; //wont return empty words
      yield currentWord;
      currentWord = '';
    }
    if (END_OF_WORD.includes(character)) continue; //saving string with blank space error
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
 * @param {string} currLine - current line
 * @param {number} currLineNum - current line number
 * @returns TFunctionTracker
 */
export function handleFunctionDeclaration({ generator, globalVariables, globalFunctions, currLine, currLineNum }) {
  let bracketStack = [];
  /** @type {TVariableTracker[]} */
  let scopeVariables = [];
  let hasAtLeastOneParenthesis = false;
  let correctReturnUsage = false;
  let hasDeclaredReturn = false;
  let functionTrackerReturn = {
    returnType: '',
    functionName: '',
    params: [],
  };

  //first line is the function declaration
  for (const word of iterateLine(currLine)) {
    if (TYPE_VARIATIONS.includes(word)) {
      continue;
    }
    if (!functionTrackerReturn.returnType && TYPES.includes(word)) {
      functionTrackerReturn.returnType = word;
      continue;
    }

    if (word === '(') {
      hasAtLeastOneParenthesis = true;
      bracketStack.push('(');
      continue;
    }

    if (word === ')') {
      displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: parameter parenthesis did not open', isError: true });
      break;
    }
    if (word === ',') {
      displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: comma outisde ()', isError: true });
      break;
    }

    if (bracketStack.length === 1) {
      //we are in the params declaration
      if (word === ',') {
        continue;
      }
      if (word === '{') {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: too early end of function declaration', isError: true });
        break;
      }
      if (word === ')') {
        //end of params declaration
        bracketStack.pop();
        continue;
      }
      if (word === '(') {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: too many (', isError: true });
        //block inside a block ERROR
        break;
      }
      if (TYPE_VARIATIONS.includes(word)) {
        continue;
      }
      if (TYPES.includes(word)) {
        functionTrackerReturn.params.push(word);
        continue;
      }

      if (!word) {
        continue;
      }
      //check if expecting parameter name?
      if (!REGEX.ALPHABETIC_THEN_ALPHANUMERIC.test(word)) {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: invalid param name', isError: true });
        break;
      }
    }

    if (word === '{') {
      if (!functionTrackerReturn.functionName || !hasAtLeastOneParenthesis) {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: function declaration ended too early', isError: true });
      }
      //function declaration ended correctly
      bracketStack.push('{');
      break;
    }

    if (!functionTrackerReturn.functionName) {
      if (!REGEX.ALPHABETIC_THEN_ALPHANUMERIC.test(word)) {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: invalid function name', isError: true });
        break;
      }

      if (globalFunctions.includes(word)) {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: function already declared', isError: true });
        break;
      }
      functionTrackerReturn.functionName = word;
      continue;
    }
  }

  if (bracketStack[1] !== '{') {
    //something went very wrong in the function declaration
    functionTrackerReturn = null;
    bracketStack = ['{']; //force interation until the end of the function
  } else {
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'valid function declaration', isError: false });
  }

  for (const { lineText, lineNumber } of generator) {
    console.log('lineText', lineText);
    if (bracketStack.length === 0) {
      //end of function block
      break;
    }
    if (!lineText) {
      continue;
    }
    const firstWord = iterateLine(lineText).next();
    if (firstWord === '}') {
      bracketStack.pop();
      if (!hasDeclaredReturn && functionTrackerReturn.returnType !== 'void') {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: Function ended without return statement', isError: true });
      }
      continue;
    }
    if (firstWord === '{') {
      displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: Wrong block inside a function', isError: true });
      continue;
    }

    if (lineText.startsWith('return')) {
      hasDeclaredReturn = true;
    }
  }
}

/**
 * @param {TVariableTracker} allVariables - already declared variables
 * @param {string} currLine - current line
 * @param {number} currLineNum - current line number
 * @returns TVariableTracker | null
 */
function handleVariableDeclaration({ allVariables, currLine, currLineNum }) {}

function handlePrintf({ generator, allVariables, allFunctions, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handleScanf({ generator, allVariables, allFunctions, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];
}

function handleConstUsage({ generator, allVariables, allFunctions, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
}

function handleReturnDeclaration({ allVariabes, allFunctions, currLine, currLineNum, expectedReturnType }) {
  /** @type {TVariableTracker[]} */
  let returnLineIdx = -1;
  let correctRetunr = false;
  for (const word of iterateLine(lineText)) {
    returnLineIdx++;
    if (returnLineIdx === 0) {
      if (word !== 'return') {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: Wrong return line', isError: true });
        break;
      }
      continue;
    }
  }
}

// function handleIfBlock({ generator, allVariables, currLine, currLineNum }) {
//   const bracketStack = [];
//   /** @type {TVariableTracker[]} */
//   const scopeVariables = [];
// }

// function handleSwitchBlock({ generator, allVariables, currLine, currLineNum }) {
//   const bracketStack = [];
//   /** @type {TVariableTracker[]} */
//   const scopeVariables = [];
// }

// function handleForLoop({ generator, allVariables, currLine, currLineNum }) {
//   const bracketStack = [];
//   /** @type {TVariableTracker[]} */
//   const scopeVariables = [];
// }

// function handleWhileLoop({ generator, allVariables, currLine, currLineNum }) {
//   const bracketStack = [];
//   /** @type {TVariableTracker[]} */
//   const scopeVariables = [];
// }

// function handleDoWhileLoop({ generator, allVariables, currLine, currLineNum }) {
//   const bracketStack = [];
//   /** @type {TVariableTracker[]} */
//   const scopeVariables = [];
// }
