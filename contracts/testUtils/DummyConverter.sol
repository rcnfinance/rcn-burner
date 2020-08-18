pragma solidity ^0.6.6;

import "../interfaces/ITokenConverter.sol";
import "../utils/SafeMath.sol";

contract DummyConverter is ITokenConverter {
    using SafeMath for uint256;
    // ex: rate = 500 => 5%
    uint256 public rate;
    uint256 constant base = 10000;
    
    function convertFrom(
        IERC20 _fromToken,
        IERC20 _toToken,
        uint256 _fromAmount,
        uint256 _minReceive
    ) external override payable  returns (uint256 _received) {
        _received = _fromAmount.multdiv(rate, base);
        require(_fromToken.transferFrom(msg.sender, address(this), _fromAmount), "Error pulling tokens");
        require(_fromToken.transfer(address(0), _fromAmount), 'Error transfer to address(0)');
        require(_toToken.transfer(msg.sender, _received), 'Error transfer converted tokens');
    }

    function convertTo(
        IERC20 _fromToken,
        IERC20 _toToken,
        uint256 _toAmount,
        uint256 _maxSpend
    ) external override payable returns (uint256 _spend) {
        _spend = _toAmount.multdiv(base, rate);
        require(_fromToken.transferFrom(msg.sender, address(this), _spend), "Error pulling tokens");
        require(_fromToken.transfer(address(0), _spend), 'Error transfer to address(0)');
        require(_toToken.transfer(msg.sender, _toAmount), 'Error transfer converted tokens');
    }

    function getPriceConvertFrom(
        IERC20 _fromToken,
        IERC20 _toToken,
        uint256 _fromAmount
    ) external override view returns (uint256 _receive) {
        return _fromAmount.multdiv(rate, base);
    }

    function getPriceConvertTo(
        IERC20 _fromToken,
        IERC20 _toToken,
        uint256 _toAmount
    ) external override view returns (uint256 _spend) {
        return _toAmount.multdiv(base, rate);
    }
}
