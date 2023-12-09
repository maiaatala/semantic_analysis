import { displayResults } from '../index.js';
import { PONCTUATIONS, END_OF_LINE, END_OF_WORD, LOGICAL_OPERATORS, MATH_OPERATORS, REGEX, TYPES, TYPE_VARIATIONS } from './lexer.contants.js';
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

    if (END_OF_LINE.includes(character) || END_OF_WORD.includes(character)) {
      //wont return empty words
      if (!['', ' '].includes(currentWord)) yield currentWord; //saving string with blank space error
      currentWord = '';
      continue;
    }

    if ([...MATH_OPERATORS, ...PONCTUATIONS, ...LOGICAL_OPERATORS].includes(character)) {
      if (currentWord !== '') yield currentWord;
      yield character;
      currentWord = '';
      continue;
    }

    currentWord = currentWord + character;
  }

  if (!['', ' '].includes(currentWord)) yield currentWord; //saving string with blank space error
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
    console.log('word', word);

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

      if (!REGEX.ALPHABETIC_THEN_ALPHANUMERIC.test(word)) {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: invalid param name', isError: true });
        break;
      }
    }

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
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: 'ERROR: parameter parenthesis did not open or too many )',
        isError: true,
      });
      break;
    }

    if (word === ',') {
      displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: comma outisde ()', isError: true });
      break;
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

  if (bracketStack[0] === '{') {
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'valid function declaration', isError: false });
  } else {
    //something went very wrong in the function declaration
    functionTrackerReturn = null;
    bracketStack = ['{']; //force interation until the end of the function
  }

  while (true) {
    const { lineText, lineNumber } = generator.next().value;
    const firstWord = iterateLine(lineText).next().value;

    if (bracketStack.length === 0) {
      return functionTrackerReturn;
    }

    if (firstWord === '}') {
      bracketStack.pop();
      if (!hasDeclaredReturn && functionTrackerReturn.returnType !== 'void') {
        displayResults({ lineNumber, lineText, result: 'ERROR: Function ended without return statement', isError: true });
      } else {
        displayResults({ lineNumber, lineText, result: 'valid end of function', isError: false });
        return functionTrackerReturn;
      }
      return;
    }
    if (firstWord === '{') {
      displayResults({ lineNumber, lineText, result: 'ERROR: Wrong block inside a function', isError: true });
      continue;
    }

    if (firstWord === 'return') {
      //analyze return
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

function handlePrintf({ allVariables, allFunctions, currLine, currLineNum }) {
  const bracketStack = [];
  /** @type {TVariableTracker[]} */
  const scopeVariables = [];

  // Verifica se a linha atual contém a chamada à função printf
  if (currLine.includes('printf')) {
    // Remove as aspas, parênteses e ponto e vírgula para análise
    const formattedLine = currLine.replace(/["();]/g, '');

    // Separa os argumentos da função printf
    const args = formattedLine
      .split(',')
      .slice(1)
      .map((arg) => arg.trim());

    // Encontra o formato de string especificado
    const formatString = currLine.match(/"([^"]*)"/);
    if (!formatString) {
      throw new Error(`Erro na linha ${currLineNum}: Formato de string não especificado no printf.`);
    }

    const formatSpecifiers = formatString[1].match(/%[diufFeEgGxXoscpaA]/g) || [];

    // Verifica se o número de especificadores de formato corresponde ao número de argumentos
    if (formatSpecifiers.length !== args.length) {
      throw new Error(`Erro na linha ${currLineNum}: Número de especificadores de formato não corresponde ao número de argumentos.`);
    }

    // Verifica cada argumento
    args.forEach((arg, index) => {
      const varName = arg.split('.')[0]; // Considera chamadas de propriedades/métodos
      const variable = allVariables.find((v) => v.name === varName);

      if (!variable) {
        throw new Error(`Erro na linha ${currLineNum}: Variável ${varName} não definida.`);
      }

      // Verifica se o tipo da variável corresponde ao especificador de formato
      // Esta é uma simplificação, pois a correspondência real entre tipos e especificadores é mais complexa
      const specifier = formatSpecifiers[index];
      if ((specifier.includes('d') || specifier.includes('i')) && variable.type !== 'int') {
        throw new Error(`Erro na linha ${currLineNum}: Tipo incorreto para especificador de formato ${specifier}. Esperado int.`);
      }
      // Adicione verificações adicionais para outros tipos e especificadores conforme necessário
    });
  }
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
