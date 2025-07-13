pragma circom 2.0.0; 

include "../node_modules/circomlib/circuits/comparators.circom";

template AgeChecker() {
    signal input dobYear;         // private input: year of birth
    signal input referenceYear;   // public input: current/reference year
    signal input challenge;       // public input: unique challenge/nonce

    signal output out;            // 1 if age >= 18, 0 otherwise
    signal output outChallenge;   
    signal output outReferenceYear;
    /* Why're we exposing these? 
        1. outChallenge: to ensure that the challenge is unique and not reused
        2. outReferenceYear: to ensure that the referenceYear is the current year
    */

    signal age;
    age <== referenceYear - dobYear;
    // age is calculated within the circuit, so it is not exposed to the provider

    // 8 = number of bits
    component lessThan = LessThan(8);
    lessThan.in[0] <== age;
    lessThan.in[1] <== 18;

    out <== 1 - lessThan.out; // 1 if age >= 18, 0 if age < 18

    // out === 1; not removing this line would mean that the circuit is not valid and any age < 18 would not be accepted at all.

    outChallenge <== challenge;
    outReferenceYear <== referenceYear;
}

component main = AgeChecker();