import { displayResults } from '../index.js';
import { removeWhiteSpace, separateStringByCharacters, splitOnWhitespace } from './utils.js';

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
