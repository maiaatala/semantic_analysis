import { displayResults } from '../index.js';
import { PONCTUATIONS, END_OF_LINE, END_OF_WORD, LOGICAL_OPERATORS, MATH_OPERATORS, REGEX, TYPES, TYPE_VARIATIONS } from './lexer.contants.js';
import { assertTypeOfWord, removeWhiteSpace, separateStringByCharacters, splitOnWhitespace } from './utils.js';

/**
 * @description this generator is used to break a line into words
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
  let scopeVariables = globalVariables || [];
  let hasAtLeastOneParenthesis = false;
  let hasDeclaredReturn = false;
  let functionTrackerReturn = {
    returnType: '',
    functionName: '',
    params: [],
  };

  let tempScopeVariable = null;

  //first line is the function declaration
  for (const word of iterateLine(currLine)) {
    if (bracketStack.length === 1) {
      if (!word) {
        continue;
      }
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
        if (tempScopeVariable?.type) {
          displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: missing param name in declaration', isError: true });
          break;
        }
        tempScopeVariable = {
          type: word,
        };
        continue;
      }

      if (!REGEX.ALPHABETIC_THEN_ALPHANUMERIC.test(word)) {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: invalid param name', isError: true });
        break;
      }

      if (!tempScopeVariable?.type) {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: param name without param type', isError: true });
        break;
      }
      tempScopeVariable.name = word;
      functionTrackerReturn.params.push(tempScopeVariable.type);
      scopeVariables.push(tempScopeVariable);
      tempScopeVariable = null;
      continue;
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

      if (globalFunctions.some((gFunctions) => gFunctions.name === word)) {
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

    if (!firstWord) {
      continue;
    }

    if (firstWord === '}') {
      bracketStack.pop();
      if (!hasDeclaredReturn && functionTrackerReturn?.returnType !== 'void') {
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

    if (firstWord === 'printf') {
      handlePrintf({
        allVariables: [...scopeVariables, ...globalVariables],
        currLine: lineText,
        currLineNum: lineNumber,
      });
      continue;
    }

    if (firstWord === 'scanf') {
      handleScanf({
        allVariables: [...scopeVariables, ...globalVariables],
        currLine: lineText,
        currLineNum: lineNumber,
      });
      continue;
    }

    if (firstWord === 'return') {
      handleReturnDeclaration({
        allVariables: [...scopeVariables, ...globalVariables],
        currLine: lineText,
        currLineNum: lineNumber,
        expectedReturnType: functionTrackerReturn?.returnType ?? 'void',
      });
      hasDeclaredReturn = true;
      continue;
    }

    if (TYPES.includes(firstWord)) {
      const maybeNewVariables = handleVariableDeclaration({
        allVariables: [...scopeVariables, ...globalVariables],
        currLine: lineText,
        currLineNum: lineNumber,
      });
      if (!!maybeNewVariables?.length) {
        scopeVariables.push(...maybeNewVariables);
      }
      continue;
    }

    if (scopeVariables.some((variable) => variable.name === firstWord)) {
      handleConstUsage({
        allVariables: scopeVariables,
        currLine: lineText,
        currLineNum: lineNumber,
      });
      continue;
    }

    if (globalFunctions.some((globalFunction) => globalFunction.functionName === firstWord)) {
      displayResults({ lineNumber, lineText, result: 'function call', isError: false });
      continue;
    }

    displayResults({ lineNumber, lineText, result: `ERROR: unkown constant/function ${firstWord}`, isError: true });
  }

  return functionTrackerReturn;
}

/**
 * @param {TVariableTracker} allVariables - already declared variables
 * @param {string} currLine - current line
 * @param {number} currLineNum - current line number
 * @returns TVariableTracker[] | null
 */
function handleVariableDeclaration({ allVariables, currLine, currLineNum }) {
  let currentVariables = [];
  let constantType = '';
  let currentWordIdx = -1;

  for (const word of iterateLine(currLine)) {
    currentWordIdx++;
    if (currentWordIdx === 0) {
      constantType = word;
      continue;
    }
    if (!word) {
      continue;
    }

    if ([...MATH_OPERATORS, ...LOGICAL_OPERATORS].includes(word)) {
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: `ERROR: operations not allowed in variable declarations`,
        isError: true,
      });
      return;
    }

    if ([',', ';'].includes(word)) {
      continue;
    }
    if (word === '(') {
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: `ERROR: CANNOT DECLARE FUNCTION INSIDE ANOTHER FUNCTION`,
        isError: true,
      });
      return;
    }
    if (allVariables.some((variable) => variable.name === word)) {
      displayResults({ lineNumber: currLineNum, lineText: currLine, result: `ERROR: variable ${word} already declared`, isError: true });
      continue;
    }
    if (REGEX.ALPHABETIC_THEN_ALPHANUMERIC.test(word)) {
      currentVariables.push({
        name: word,
        type: constantType,
      });
      continue;
    }
    displayResults({
      lineNumber: currLineNum,
      lineText: currLine,
      result: `ERROR: invalid variable name ${word}`,
      isError: true,
    });
  }

  if (!!currentVariables?.length) {
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: `at least one valid variable declaration`, isError: false });
    return currentVariables;
  }
}

function handlePrintf({ allVariables, currLine, currLineNum }) {
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
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: wrong printf format', isError: true });
    return;
  }

  const formatSpecifiers = formatString[1].match(/%[diufFeEgGxXoscpaA]/g) || [];

  // Verifica se o número de especificadores de formato corresponde ao número de argumentos
  if (formatSpecifiers.length !== args.length) {
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'ERROR: too many or too little arguments', isError: true });
    return;
  }

  // Verifica cada argumento
  args.forEach((arg, index) => {
    const varName = arg.split('.')[0]; // Considera chamadas de propriedades/métodos
    const variable = allVariables.find((v) => v.name === varName);

    if (!variable) {
      displayResults({ lineNumber: currLineNum, lineText: currLine, result: `ERROR: variable ${varName} is not defined`, isError: true });
      return;
    }

    // Verifica se o tipo da variável corresponde ao especificador de formato
    const specifier = formatSpecifiers[index];
    if ((specifier?.includes('d') || specifier?.includes('i')) && variable.type !== 'int') {
      displayResults({ lineNumber: currLineNum, lineText: currLine, result: `ERROR: wrong type specified for ${varName}`, isError: true });
      return;
    }
    // Adicione verificações adicionais para outros tipos e especificadores conforme necessário
  });

  displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'valid printf statement', isError: false });
}

function handleScanf({ allVariables, currLine, currLineNum }) {
  // Verifica se a linha atual contém a chamada à função scanf
  if (currLine.includes('scanf')) {
    // Remove as aspas, parênteses e ponto e vírgula para análise
    const formattedLine = currLine.replace(/["();]/g, '');

    // Separa os argumentos da função scanf
    const args = formattedLine
      .split(',')
      .slice(1)
      .map((arg) => arg.trim());

    // Encontra o formato de string especificado
    const formatString = currLine.match(/"([^"]*)"/);
    if (!formatString) {
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: 'ERROR: Formato de string não especificado no scanf',
        isError: true,
      });
      return;
    }

    const formatSpecifiers = formatString[1].match(/%[diufFeEgGxXoscpaA*]/g) || [];

    // Verifica se o número de especificadores de formato corresponde ao número de argumentos
    if (formatSpecifiers.length !== args.length) {
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: 'ERROR: Número de especificadores de formato não corresponde ao número de argumentos',
        isError: true,
      });
      return;
    }

    // Verifica cada argumento
    args.forEach((arg, index) => {
      const variable = allVariables.find((v) => v.name === arg);

      if (!variable) {
        displayResults({
          lineNumber: currLineNum,
          lineText: currLine,
          result: `ERROR: Variável ${arg} não definida`,
          isError: true,
        });
        return;
      }

      // Verifica se o tipo da variável corresponde ao especificador de formato
      const specifier = formatSpecifiers[index];
      const formatMatch = FORMAT_TYPE_MATCH.find((formatType) => formatType.type === variable.type);

      if (!formatMatch || !formatMatch.format.includes(specifier)) {
        displayResults({
          lineNumber: currLineNum,
          lineText: currLine,
          result: `ERROR: Especificador de formato ${specifier} não corresponde ao tipo da variável ${variable.type}`,
          isError: true,
        });
        return;
      }
    });
  }
}

function handleConstUsage({ allVariables, currLine, currLineNum }) {
  // Expressão regular para identificar atribuições
  const assignmentRegex = /(\w+)\s*=\s*([^;]+);/;

  // Verifica se a linha atual contém uma atribuição
  const match = currLine.match(assignmentRegex);
  if (match) {
    const varName = match[1];
    const value = match[2].trim();

    // Encontra a variável no array de todas as variáveis
    const variable = allVariables.find((v) => v.name === varName);
    if (!variable) {
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: `ERROR: Variável ${varName} não definida`,
        isError: true,
      });
      return;
    }

    // Utiliza a função assertTypeOfWord para determinar o tipo do valor
    const valueType = assertTypeOfWord(value);

    // Verifica se o tipo do valor é compatível com o tipo da variável
    if (valueType !== variable.type) {
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: `ERROR: Tipo do valor atribuído à variável ${varName} (${valueType}) não corresponde ao seu tipo declarado (${variable.type})`,
        isError: true,
      });
    }
  }
}

function handleReturnDeclaration({ allVariables, currLine, currLineNum, expectedReturnType }) {
  /** @type {TVariableTracker[]} */
  let returnLineIdx = -1;
  let correctReturn = false;
  for (const word of iterateLine(currLine)) {
    returnLineIdx++;
    if (returnLineIdx === 0) {
      continue;
    }
    if (word.startsWith('"') || word.startsWith("'")) {
      if (expectedReturnType !== 'char') {
        displayResults({
          lineNumber: currLineNum,
          lineText: currLine,
          result: 'ERROR: wrong return statement for declared function type',
          isError: true,
        });
      } else {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'valid return statement', isError: false });
      }
      return;
    }
    if (word && expectedReturnType === 'void') {
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: 'ERROR: function should return nothing',
        isError: true,
      });
      return;
    }

    if ([...MATH_OPERATORS, ...LOGICAL_OPERATORS].includes(word)) {
      if (['int', 'double', 'float'].includes(expectedReturnType)) {
        if (word === '/' && expectedReturnType === 'int') {
          displayResults({
            lineNumber: currLineNum,
            lineText: currLine,
            result: `ERROR: return type ${expectedReturnType} should not have division`,
            isError: true,
          });
          break;
        }
        correctReturn = false;
        continue;
      }

      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: `ERROR: return type ${expectedReturnType} should not have math operations`,
        isError: true,
      });
      break;
    }

    const maybeNumber = assertTypeOfWord(word);

    if (['int', 'float'].includes(maybeNumber)) {
      if (!['int', 'double', 'float'].includes(expectedReturnType)) {
        displayResults({ lineNumber: currLineNum, lineText: currLine, result: `ERROR: wrong return type for ${expectedReturnType}`, isError: true });
        return;
      }
      if (expectedReturnType === 'int' && maybeNumber === 'int') {
        correctReturn = true;
        continue;
      }
      if (['double', 'float'].includes(expectedReturnType) && maybeNumber === 'float') {
        correctReturn = true;
        continue;
      }
      displayResults({
        lineNumber: currLineNum,
        lineText: currLine,
        result: `ERROR: wrong number ${word} for return type ${expectedReturnType}`,
        isError: true,
      });
      return;
    }

    const variable = allVariables.find((v) => v.name === word);
    if (variable) {
      if (variable.type === expectedReturnType) {
        correctReturn = true;
        continue;
      } else {
        displayResults({
          lineNumber: currLineNum,
          lineText: currLine,
          result: `ERROR: varible is not of the type ${expectedReturnType}`,
          isError: true,
        });
        return;
      }
    } else {
      displayResults({ lineNumber: currLineNum, lineText: currLine, result: `ERROR: variable ${word} not declared`, isError: true });
      return;
    }
  }

  if (correctReturn) {
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'valid return statement', isError: false });
    return;
  }
  if (returnLineIdx === 0 && expectedReturnType === 'void') {
    displayResults({ lineNumber: currLineNum, lineText: currLine, result: 'valid void return statement', isError: false });
    return;
  }
  displayResults({ lineNumber: currLineNum, lineText: currLine, result: `ERROR: wrong return statement for ${expectedReturnType}`, isError: true });
}
