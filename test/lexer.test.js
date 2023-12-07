import { describe, expect, test } from 'bun:test';
import { lineLexer } from '../modules/lexer';
import { TOKEN_TYPES } from '../modules/lexer.contants';

describe('lineLexer test', () => {
  test('should identify word', () => {
    expect(lineLexer('hello', 0)).toEqual([
      {
        text: 'hello',
        type: TOKEN_TYPES.IDENTIFIER,
        loc: {
          line: 0,
          startColumn: 0,
          endColumn: 5,
        },
      },
    ]);
  });
  test('should identify word and ignore comment', () => {
    expect(lineLexer('hello //@! 123 comment', 0)).toEqual([
      {
        text: 'hello',
        type: TOKEN_TYPES.IDENTIFIER,
        loc: {
          line: 0,
          startColumn: 0,
          endColumn: 5,
        },
      },
    ]);
  });
});

describe('should identify simple expression', () => {
  test('identifier + identifier', () => {
    expect(lineLexer('a+b', 0)).toEqual([
      {
        text: 'a',
        type: TOKEN_TYPES.IDENTIFIER,
        loc: {
          line: 0,
          startColumn: 0,
          endColumn: 1,
        },
      },
      {
        text: '+',
        type: TOKEN_TYPES.PUNCTUATION,
        loc: {
          line: 0,
          startColumn: 1,
          endColumn: 2,
        },
      },
      {
        text: 'b',
        type: TOKEN_TYPES.IDENTIFIER,
        loc: {
          line: 0,
          startColumn: 2,
          endColumn: 3,
        },
      },
    ]);
  });
  test('identifier = number / number', () => {
    expect(lineLexer('foo = 70 / 5', 0)).toEqual([
      {
        text: 'foo',
        type: TOKEN_TYPES.IDENTIFIER,
        loc: {
          line: 0,
          startColumn: 0,
          endColumn: 3,
        },
      },
      {
        text: '=',
        type: TOKEN_TYPES.PUNCTUATION,
        loc: {
          line: 0,
          startColumn: 4,
          endColumn: 5,
        },
      },
      {
        text: '70',
        type: TOKEN_TYPES.NUMBER,
        loc: {
          line: 0,
          startColumn: 6,
          endColumn: 8,
        },
      },
      {
        text: '/',
        type: TOKEN_TYPES.PUNCTUATION,
        loc: {
          line: 0,
          startColumn: 9,
          endColumn: 10,
        },
      },
      {
        text: '5',
        type: TOKEN_TYPES.NUMBER,
        loc: {
          line: 0,
          startColumn: 11,
          endColumn: 12,
        },
      },
    ]);
  });
});

describe('should handle invalid symbols', () => {
  test('should handle invalid symbols', () => {
    expect(lineLexer('@aux=10;', 0)).toEqual([
      {
        text: '@',
        type: TOKEN_TYPES.INVALID_TOKEN,
        loc: {
          line: 0,
          startColumn: 0,
          endColumn: 1,
        },
      },
      {
        text: 'aux',
        type: TOKEN_TYPES.IDENTIFIER,
        loc: {
          line: 0,
          startColumn: 1,
          endColumn: 4,
        },
      },
      {
        text: '=',
        type: TOKEN_TYPES.PUNCTUATION,
        loc: {
          line: 0,
          startColumn: 4,
          endColumn: 5,
        },
      },
      {
        text: '10',
        type: TOKEN_TYPES.NUMBER,
        loc: {
          line: 0,
          startColumn: 5,
          endColumn: 7,
        },
      },
    ]);
  });
});
