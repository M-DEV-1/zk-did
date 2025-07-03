pragma circom 2.0.0; 

include "../node_modules/circomlib/circuits/comparators.circom";

template AgeChecker() {
    // private
    // TODO: 1. pre-convert dob to age, OR 2. add dob to age logic here (easier preferred)
    signal input age;

    // true/false
    signal output out;

    // 8 = number of bits
    component lessThan = LessThan(8); 
    lessThan.in[0] <== age;
    lessThan.in[1] <== 18;
    
    out <== 1 - lessThan.out;
    out === 1;

}

component main = AgeChecker();