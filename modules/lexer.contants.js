export const END_OF_LINE = [';']; // END OF LINE MARKER IN C
export const END_OF_WORD = [' ', '\t', '\n', '\r\n', '\r', '\0', ',']; //WHEN IT WILL STOP AGGREGATING CHARACTERS
export const MATH_OPERATORS = ['+', '-', '*', '/', '%', '++', '--'];
export const LOGICAL_OPERATORS = ['==', '!=', '>', '<', '>=', '<=', '&&', '||', '!'];
export const TYPES = ['int', 'float', 'double', 'char', 'void'];
export const TYPE_VARIATIONS = ['long', 'short', 'unsigned', 'signed '];
export const POINTER = ['*'];
export const ADDRESS = ['&'];
export const IMPORTS_DEFINE = ['#include', '#define'];
export const SWITCH_CASE = ['switch', 'case', 'default'];
export const IF_STATE = ['if', 'else'];
export const LOOPS = ['for', 'while', 'do'];
export const OUTPUT = ['printf'];
export const INPUT = ['scanf'];
export const COMMENT = ['//', '/*', '*/'];
export const INTERNAL_FUNCTIONS = ['system'];
export const FORMAT_TYPE_MATCH = [
  {
    format: ['%d', '%hi', '%hd', '%hu', '%i', '%u', '%li', '%lu'],
    type: ['int'],
  },
  {
    format: ['%f', '%lf'],
    type: ['float', 'double'],
  },
  {
    format: ['%c', '%[^\n]s', '%[^\n]%*c', '%s'],
    type: ['char'],
  },
];

export const REGEX = {
  ALPHABETIC: /^[a-zA-Z_$]+$/,
  NUMBERIC: /^[0-9]+$/,
  ALPHABETIC_THEN_ALPHANUMERIC: /^[a-zA-Z_$][a-zA-Z_\$0-9]*/,
};
