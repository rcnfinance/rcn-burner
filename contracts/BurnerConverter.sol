pragma solidity ^0.6.6;

import "./interfaces/IERC20.sol";
import "./interfaces/ITokenConverter.sol";
import "./utils/SafeERC20.sol";
import "./commons/Ownable.sol";
import "./utils/SafeMath.sol";
    

contract BurnerConverter is Ownable {
    using SafeMath for uint256;  
    using SafeERC20 for IERC20;
    
    IERC20 public burnToken;
    ITokenConverter public converter;
    
    constructor(
        IERC20 _burnToken,
        ITokenConverter _converter
        ) public {
        burnToken = _burnToken;
        converter = _converter;
    }
        
    event BurnTokens(IERC20 _soldToken, uint256 _soldAmount,uint256 _burnAmount);  
    event SetConverter(ITokenConverter _converter);

    function setConverter(ITokenConverter _converter) external onlyOwner {
        require(address(_converter) != address(0), "Converter 0x0 is not valid");
        converter = _converter;
        emit SetConverter(_converter);
    }
    
    function getPriceConvertFrom(IERC20 _fromToken, IERC20 _toToken, uint256 _fromAmount) external view returns (uint256){
        return converter.getPriceConvertFrom(_fromToken,_toToken,_fromAmount);
    }
    
    function getSoldTBalance(IERC20 _token) external view returns (uint256){
        return _token.balanceOf(address(this));
    }
        
    function executeBurning(IERC20 _soldToken, uint256 _soldAmount, uint256 _minReceive) external onlyOwner returns (bool) {
  
        _approveOnlyOnce(_soldToken, address(converter), _soldAmount);
        
        uint256 receivedBurnT = converter.convertFrom(
            _soldToken,
            burnToken,
            _soldAmount,
            _minReceive  
        );
      
        require(receivedBurnT >= _minReceive, "BurnerConverter/Amount received is less than minReceived");
        require(IERC20(burnToken).transfer(address(0), receivedBurnT), "BurnerConverter/Failed to burn converted Tokens");
        
        emit BurnTokens(_soldToken, _soldAmount, receivedBurnT);
        
        return true;
    }
    
    
    function _approveOnlyOnce(
        IERC20 _token,
        address _spender,
        uint256 _amount
    ) private {
        uint256 allowance = _token.allowance(address(this), _spender);
        if (allowance < _amount) {
            if (allowance != 0) {
                _token.clearApprove(_spender);
            }

            _token.approve(_spender, uint(-1));
        }
    }
}







