#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_SIZE 250 //sets the maximum char for the string

// challange on: https://www.reddit.com/r/dailyprogrammer/comments/myx3wn/20210426_challenge_387_easy_caesar_cipher/
/* 
Ascii 96 : a
Ascii 122 : z
Ascii 65 : A
Ascii 90 : Z */

/* asdasd */

int caesar(char letter, int increment, short int caseresult){
    /*function does the caesar shift on the alphabet
    on both the lowercase (1) ir uppercase (0)*/
    int leftover, sum;
    char coded_letter;

    sum = letter + increment;

    switch (caseresult){
        case 1:  //case 1 is lowercase
            if (sum > 122){ //it checks to see if it is above of the lowercase bounds
                leftover = sum - 123; //leftover checks how much it needs to shift from the start
                coded_letter = 97 + leftover;
            }else if (sum < 97){ //checks to see if it is below the lowercase bounds
                leftover = 96 - sum; //leftover checks how much it needs to shift from the end
                coded_letter = 122 - leftover;
            }
            else{
                coded_letter = sum;
            }
        break;

        case 0: //case 0 is uppercase
            if (sum > 90){  //it checks to see if it is beyond Z
                leftover = sum - 91; //leftover checks how much it needs to shift from the start
                coded_letter = 65 + leftover;
            }else if (sum < 65){ //checks to see if it is below A
                leftover = 64 - sum; //leftover checks how much it needs to shift from the end
                coded_letter = 90 - leftover;
            }else{
                coded_letter = sum;
            }
        break;
    }
    return (coded_letter);
}

void caesar_cipher_logic(int shift, char *phrase, char *code){
    //variables
    int min_shift, i;
    short int condition;
    //min_shift calc
    if (shift < 0 ){ //i did let the user put whichver integer they wanted
        min_shift = shift % -26;
    }else{
        min_shift = shift % 26;
    }
    //caesar logic
    for (i = 0; i <= MAX_SIZE; i++){
        if ((97 <= phrase[i]) && (phrase[i] <= 122)){
            //checks to see if it's a lowercase
            condition = 1;
            code[i] = caesar(phrase[i], min_shift, condition);
        }else if((65 <= phrase[i]) && (phrase[i] <= 95)){
            //checks to see if it's an uppercase
            condition = 0;
            code[i] = caesar(phrase[i], min_shift, condition);            
        }else{ 
            /* if it's not part of the alphabet, on either lower case or upper case,
            it mantains the same characters as the original phrase */
            code[i] = phrase[i];
        }
    }
}

void phrase_to_caesar_program(){
    //variables
    char phrase[MAX_SIZE], code[MAX_SIZE];
    int shift;
    //data input
    printf  ("\n\nWrite your super secret phrase: \n\t");
    scanf   ("%[^\n]s", &phrase);

    fflush  (stdin);    //cleaning the overflow on the cmd
    printf  ("Write whichever intenger increment you want:\n\t");
    scanf   ("%d", &shift);

    //processing
    //erasing the \n on the end of the fgets and replacing with 0 'cuz formatting
    phrase[strcspn(phrase, "\n")] = 0;  
    caesar_cipher_logic(shift, phrase, code); //the funcion that does the codification

    //output
    printf  ("\n-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-\n");
    printf  ("The input phrase is: \n");
    printf  ("\t%s \n",phrase);
    printf  ("The caesar_chiper with %d of shift is: \n",shift);
    printf  ("\t%s \n",code);
    printf  ("-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-=x=-\n\n");
}


int main(){
    system  ("cls");

    printf  ("+---------------------------------------------------+\n");
    printf  ("| Code your phrases using the caesar cipher method! |\n");
    //printf  ("acentos nao suportados.\n");
    printf  ("|    --Special characters will not be changed.--    |\n");
    printf  ("|               --Char limit is %d--               |\n",MAX_SIZE);
    printf  ("+---------------------------------------------------+\n");

    phrase_to_caesar_program (); //function of the program

    credits ();
    system  ("pause");
    return  (0);
}



void credits(){
    printf  ("\n:--------------+---------------:\n");
    printf  ("|          End credits         |\n");
    printf  ("| Programmer:  | Ana Atala     |\n");
    printf  ("| Date:        | June 06, 2021 |\n");
    printf  (":--------------+---------------:\n\n");  
}