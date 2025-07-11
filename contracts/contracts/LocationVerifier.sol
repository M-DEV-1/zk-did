// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import {IVerifier} from "./interfaces/IVerifier.sol";

error InvalidProof();
error LocationNotVerified();

contract LocationVerifier {
    address public immutable verifier;

    event LocationVerified(address indexed user);

    constructor(address _verifier) {
        verifier = _verifier;
    }

    function verifyLocation(
        uint256[8] calldata _proof,
        uint256[4] calldata _input
    ) external {
        if (_input[3] != 1) revert LocationNotVerified();

        uint256[] memory input;
        for (uint256 i = 0; i < 4; i++) {
            input[i] = _input[i];
        }

        bool success = IVerifier(verifier).verifyProof(
            [_proof[0], _proof[1]],
            [[_proof[2], _proof[3]], [_proof[4], _proof[5]]],
            [_proof[6], _proof[7]],
            input
        );

        if (!success) revert InvalidProof();

        emit LocationVerified(msg.sender);
    }
}
