# Atividade Compiladores

Ana Carolina Maia Atala ana.atala@unemat.br
Leonel Bressanin leonel.bressanin@unemat.br
git: https://github.com/maiaatala/semantic_analysis

## A Linguagem

O Programa analisa um codigo simples em C, _sem pointeiros ou verificacoes de funcoes baseada por import_
o codigo exemplo a ser usado é:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_SIZE 250 //sets the maximum char for the string

/*
Ascii 96 : a
Ascii 122 : z
Ascii 65 : A
Ascii 90 : Z */ asdasd

int sum(int a, int b){
    return a + b;
}

void printInput(){
    int a, b;
    printf("Enter two numbers: ");
    scanf("%d", &b);
    scanf("%d", &b);
    printf("The sum is: %d %d\n", a,b);
    printf("number inputed is: %d\n", MAX_SIZE);
    int a;
    a = 0;
    b = 5.44;
}

void function2(){
    char phrase = "Hello World";
    int key;
    key = 3;
    double division;
    division = key / phrase;
    printf("%s", division);
    int functionINFunction(){};
}


int main(){
    printf  ("semantic analyzer example in simple C code\n");
    printInput();

    function2(); //function of the program

    credits ();
    return 0;
}

int wrongReturn(){
    return;
}

void 12wrongNameFunction(){
    return;
}

```

## Funcionamento

O Analisador quebra um arquivo em linhas
para cada linha, ele roda uma a função `analyzeSemantics` em `modules/lexer.js`, tomando diferentes decições de acordo com a palavra encontrada
as constants usadas pelo programa se econtram em `modules/lexer.contants.js` como

```js
export const MATH_OPERATORS = ['=', '+', '-', '*', '/', '%', '++', '--'];
export const LOGICAL_OPERATORS = ['==', '!=', '>', '<', '>=', '<=', '&&', '||', '!'];
export const TYPES = ['int', 'float', 'double', 'char', 'void'];
export const TYPE_VARIATIONS = ['long', 'short', 'unsigned', 'signed '];
```

as funcoes resposável por analisar o codigo estão em `modules/lexer.functions.js`

### Iterator

a função `iterateLine` é responsável por ler cada linha do arquivo fonte e retornar, conforme for encontrando, palavras válidas,
ela não retorna palavras vazias ou os caracteres encontrados em

```js
export const END_OF_LINE = [';']; // END OF LINE MARKER IN C
export const END_OF_WORD = [' ', '\t', '\n', '\r\n', '\r', '\0']; //WHEN IT WILL STOP AGGREGATING CHARACTERS
```

### Comments

A função `handleComments` é acionada quando o começo de um comentário é encontrado e é responsável por varrer o código ate encontrar o fim do bloco de comentário

### Imports

A função `handleImportDeclaration` é responsável por analisar a declaração de um `#includes` em C e verifica se há um import valido ou se um import ja foi declarado

### Constants

Em C, é possivel declarar constantes globais usando `#define`, a função `handleConstDeclaration` é responsável verificar a declaração, se ela é valida ou se ja foi declarada

### Funções

A função `handleFunctionDeclaration` é usada para verificar a declaração da função e iterar dentro dela.

- Verifica o tipo da função e se o return é condizente
- Verifica se os parametros estão sendo declarados corretamente
- invoca outras funções que analisam o codigo interno a função

### Variaveis

a função `handleVariableDeclaration` verifica:

- Se a variavel ja foi declarada
- Se há uma tentativa de declarar uma função dentro da função (algo nao permitido em C)
- Se o nome da variavel é válida
- Se há operação matematica sendo realizada durante a declaração (limitacao do codigo)

se há alguma variável válida, adiciona ela na lista das variaveis de bloco da função

a verificação se a atribuação a uma variável é valida é feita pela função `handleConstUsage`

### printf

A verificação se um print é valido é feita pela função `handlePrintf`, ela verifica se alguma variável é usada no print e se o tipo condiz com a formatação usada em C

### scanf

A verificação se um print é valido é feita pela função `handleScanf`, ela verifica se a variavel a ser lida já foi declarada e se o tipo do scanf é condizente com o tipo da variável

### handleReturnDeclaration

a função `handleReturnDeclaration` verifica:

- se o conteudo do return é condizente com o tipo de da função no momento em que ela for declarada
  - Se a declaração da função foi invalida, ela assume que o retorno é do tipo 'void'
- se tiver variavel, se ela ja foi declarada e se o tipo bate
- se tiver divisão verifica se o tipo do retorno é `float`
