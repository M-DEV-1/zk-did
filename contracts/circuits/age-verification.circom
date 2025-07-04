pragma circom 2.0.0; 

include "../node_modules/circomlib/circuits/comparators.circom";

template AgeChecker() {
    // private
    // TODO: 1. pre-convert dob to age, OR 2. add dob to age logic here (easier preferred)
    signal input age;
    // signal input challenge;

    // true/false
    signal output out;

    // 8 = number of bits
    component lessThan = LessThan(8); 
    lessThan.in[0] <== age;
    lessThan.in[1] <== 18;

    out <== 1 - lessThan.out; // 1 if age >= 18, 0 if age < 18

    // out === 1; not removing this line would mean that the circuit is not valid and any age < 18 would not be accepted at all.

}

component main = AgeChecker();