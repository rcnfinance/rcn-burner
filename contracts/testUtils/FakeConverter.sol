pragma solidity ^0.6.6;

import "../interfaces/ITokenConverter.sol";
import "../utils/SafeMath.sol";
import "../commons/Ownable.sol";


contract FakeConverter is ITokenConverter, Ownable {
    using SafeMath for uint256;
    // ex: rate = 500 => 5%
    uint256 public reserveA;
    uint256 public reserveB;

    event SetReserves(uint256 _reserveA, uint256 _reserveB);

    function setReserves(uint256 _reserveA, uint256 _reserveB) external onlyOwner {
        reserveA = _reserveA;
        reserveB = _reserveB;
        emit SetReserves(_reserveA, _reserveB);
    }
    
    function convertFrom(
        IERC20 _fromToken,
        IERC20 _toToken,
        uint256 _fromAmount,
        uint256 _minReceive
    ) external override payable  returns (uint256 _received) {
        _received = _getAmount(_fromAmount, reserveA, reserveB);
        require(_fromToken.transferFrom(msg.sender, address(this), _fromAmount), "Error pulling tokens");
        require(_fromToken.transfer(address(0), _fromAmount), "Error transfer to address(0)");
        require(_toToken.transfer(msg.sender, _received), "Error transfer converted tokens");
    }

    function getPriceConvertFrom(
        IERC20 _fromToken,
        IERC20 _toToken,
        uint256 _fromAmount
    ) external override view returns (uint256 _receive) {
        return _getAmount(_fromAmount, reserveA, reserveB);
    }

    function convertTo(
        IERC20 _fromToken,
        IERC20 _toToken,
        uint256 _toAmount,
        uint256 _maxSpend
    ) external override payable returns (uint256 _spend) {
        _spend = _getAmount(_toAmount, reserveB, reserveA);
        require(_fromToken.transferFrom(msg.sender, address(this), _spend), "Error pulling tokens");
        require(_fromToken.transfer(address(0), _spend), "Error transfer to address(0)");
        require(_toToken.transfer(msg.sender, _toAmount), "Error transfer converted tokens");
    }

    function getPriceConvertTo(
        IERC20 _fromToken,
        IERC20 _toToken,
        uint256 _toAmount
    ) external override view returns (uint256 _spend) {
        return _getAmount(_toAmount, reserveB, reserveA);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function _getAmount(uint256 amountA, uint256 reserveA, uint256 reserveB) internal pure returns (uint amountB) {
        amountB = amountA.multdiv(reserveB, reserveA);
    }
}
