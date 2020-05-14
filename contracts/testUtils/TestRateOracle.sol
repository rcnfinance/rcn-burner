pragma solidity ^0.5.12;

import "../interfaces/RateOracle.sol";


contract TestRateOracle is RateOracle {
    address internal _token;
    uint256 public RCNequivalent;

    event SetEquivalent(uint256 _equivalent);

    function setToken(address token) external returns (address) {
        _token = token;
    }

    function setEquivalent(uint256 _equivalent) external {
        RCNequivalent = _equivalent;
        emit SetEquivalent(_equivalent);
    }

    function readSample(bytes calldata) external returns (uint256 tokens, uint256 equivalent) {
        tokens = 1000000000000000000000000000000000000;
        equivalent = RCNequivalent;
    }
}
