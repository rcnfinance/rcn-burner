/* solium-disable */
pragma solidity ^0.6.6;


interface RateOracle {
    function readSample(bytes calldata _data) external returns (uint256 _tokens, uint256 _equivalent);
}
