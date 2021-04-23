pragma solidity ^0.6.6;

import "./interfaces/IERC20.sol";
import "./utils/SafeERC20.sol";
import "./commons/Ownable.sol";
import "./utils/SafeMath.sol";


contract BurnerBridge is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event Withdraw(IERC20 _token, address _to, uint256 _amount);

    function withdrawToken(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        _token.safeTransfer(_to, _amount);
        emit Withdraw(_token, _to, _amount);
    }
}
