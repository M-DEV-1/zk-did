pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template LocationProof() {
    // private inputs (user's location)
    // ASSUMPTION: THESE ARE PRE-SCALED TO 10^6
    signal input userLat;
    signal input userLon;

    // public inputs (provider's location and allowed radius)
    signal input providerLat;
    signal input providerLon;
    signal input radius;

    // 1 if user is within radius, 0 otherwise
    signal output out;
    signal output pLat;
    signal output pLon;
    signal output rad;

    // Compute deltas
    signal deltaLat;
    signal deltaLon;

    deltaLat <== userLat - providerLat;
    deltaLon <== userLon - providerLon;

    // Squared distance
    signal deltaLat2;
    signal deltaLon2;
    signal dist2;

    deltaLat2 <== deltaLat * deltaLat;
    deltaLon2 <== deltaLon * deltaLon;

    dist2 <== deltaLat2 + deltaLon2;

    // Squared radius
    signal radius2;
    radius2 <== radius * radius;

    // compare dist2 <= radius2
    component cmp = LessThan(64); // 64 bits should be enough for squared distances
    cmp.in[0] <== dist2;
    cmp.in[1] <== radius2 + 1; // dist2 < radius2+1  <=> dist2 <= radius2

    out <== cmp.out;
    rad <== radius;
    pLat <== providerLat;
    pLon <== providerLon;

    out * (out - 1) === 0;
}

component main = LocationProof(); 
