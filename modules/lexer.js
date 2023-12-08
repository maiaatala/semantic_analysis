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

// make functions to handle switch, if, for, while, do, printf, scanf, system

// make function to print out each end of line result

// function analyzeToken(currentLexer, endColumn) {
//   const tokenBuilder = (type) => ({
//     text: currentLexer.text,
//     type,
//     loc: {
//       line: currentLexer.startLine,
//       startColumn: currentLexer.startCol,
//       endColumn: endColumn + 1,
//     },
//   });

//   if (
//     currentLexer.text == undefined ||
//     currentLexer.text === '' ||
//     END_OF_WORD.includes(currentLexer.text) ||
//     END_OF_LINE.includes(currentLexer.text)
//   ) {
//     return null;
//   }

//   if (KEYWORDS.includes(currentLexer.text)) {
//     return tokenBuilder(TOKEN_TYPES.RESERVED);
//   }

//   if (PUNCTUATIONS.includes(currentLexer.text)) {
//     return tokenBuilder(TOKEN_TYPES.PUNCTUATION);
//   }

//   if (REGEX.NUMBERIC.test(currentLexer.text)) {
//     return tokenBuilder(TOKEN_TYPES.NUMBER);
//   }

//   if (REGEX.ALPHABETIC_THEN_ALPHANUMERIC.test(currentLexer.text)) {
//     return tokenBuilder(TOKEN_TYPES.IDENTIFIER);
//   }

//   return tokenBuilder(TOKEN_TYPES.INVALID_TOKEN);
// }

// class Lexeme {
//   constructor(text = '', state = LEXER_STATES.START, startLine, startCol) {
//     this.text = text;
//     this.state = state;
//     this.startLine = startLine;
//     this.startCol = startCol;
//   }
// }

// const cleanCurentLexeme = (startLine, startCol) => new Lexeme(undefined, undefined, startLine, startCol);

// const LEXER_STATES = {
//   START: 'START',
//   WORD_ITERATION: 'WORD',
//   NUMBER_ITERATION: 'NUMBER',
//   FINAL: 'FINAL',
// };

// export function lineLexer(input, currentLine) {
//   if (typeof input !== 'string') {
//     throw new Error('Input must be a string');
//   }

//   let tokens = [];
//   let currentLexeme = cleanCurentLexeme(currentLine, 0);
//   const maxInputLenght = input.length;

//   for (const [index, character] of enumerate(input)) {
//     if (END_OF_LINE.includes(character) || END_OF_WORD.includes(character)) {
//       tokens.push(analyzeToken(currentLexeme, index - 1));

//       currentLexeme = cleanCurentLexeme(currentLine, index + 1);
//     }

//     if (PUNCTUATIONS.includes(character)) {
//       //verify if next character is also a /
//       if (character === '/' && input[index + 1] === '/') {
//         // line is a comment, ignore
//         break;
//       }
//       //analyze previous token since a punctuation was found
//       tokens.push(analyzeToken(currentLexeme, index - 1));

//       //add punctiation as <toke></toke>n
//       currentLexeme = new Lexeme(character, LEXER_STATES.WORD_ITERATION, currentLine, index);
//       tokens.push(analyzeToken(currentLexeme, index));

//       //reset lexema
//       currentLexeme = cleanCurentLexeme(currentLine, index);
//       continue;
//     }

//     //check if we have a valid alphanumeric character
//     if (!(REGEX.ALPHABETIC.test(character) || REGEX.NUMBERIC.test(character))) {
//       //analyze previous token since an invalid character was found
//       tokens.push(analyzeToken(currentLexeme, index - 1));

//       //analyse the character as a token
//       currentLexeme = new Lexeme(character, LEXER_STATES.WORD_ITERATION, currentLine, index);
//       tokens.push(analyzeToken(currentLexeme, index));

//       //reset lexema
//       currentLexeme = cleanCurentLexeme(currentLine, index);
//       continue;
//     }

//     //if we have a new lexeme, validate the type of character and set the state
//     if (currentLexeme.state === LEXER_STATES.START) {
//       if (REGEX.NUMBERIC.test(character)) {
//         currentLexeme = new Lexeme(character, LEXER_STATES.NUMBER_ITERATION, currentLine, index);
//       }

//       currentLexeme = new Lexeme(character, LEXER_STATES.WORD_ITERATION, currentLine, index);
//       continue;
//     }

//     //if we have an identifier, just keep adding to it
//     if (currentLexeme.state === LEXER_STATES.WORD_ITERATION) {
//       currentLexeme.text += character;
//       continue;
//     }

//     if (currentLexeme.state === LEXER_STATES.NUMBER_ITERATION) {
//       if (REGEX.NUMBERIC.test(character)) {
//         currentLexeme.text += character;
//         continue;
//       }
//       //if we have a string while on the number state, analyse the previous number and start a new state
//       tokens.push(analyzeToken(currentLexeme, index - 1));

//       currentLexeme = new Lexeme(character, LEXER_STATES.WORD_ITERATION, currentLine, index);
//       continue;
//     }
//   }

//   //javascript fix for no end of line character
//   tokens.push(analyzeToken(currentLexeme, maxInputLenght - 1));

//   return tokens.filter(Boolean);
// }
