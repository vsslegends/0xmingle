// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title 0xMingle TipSplitter — enforced stranger-tip fee split.
/// @notice Holds no funds: each tip forwards recipient + treasury shares in the
///         same call. Fee math mirrors the off-chain quote
///         (fee = amount * feeBps / 10000, rounded down).
///         Direct deposits revert so the fee cannot be bypassed.
contract TipSplitter {
    address public immutable treasury;
    uint256 public immutable feeBps; // e.g. 500 = 5%

    event Tipped(address indexed from, address indexed recipient, uint256 amount, uint256 fee);

    error ZeroRecipient();
    error ZeroValue();
    error TransferFailed();

    constructor(address _treasury, uint256 _feeBps) {
        require(_treasury != address(0), "treasury required");
        require(_feeBps <= 10_000, "bps overflow");
        treasury = _treasury;
        feeBps = _feeBps;
    }

    /// @param recipient Stranger receiving amount - fee. Caller funds msg.value.
    function tip(address recipient) external payable {
        if (recipient == address(0)) revert ZeroRecipient();
        if (msg.value == 0) revert ZeroValue();
        uint256 fee = (msg.value * feeBps) / 10_000;
        if (fee > 0) {
            (bool okT,) = treasury.call{value: fee}("");
            if (!okT) revert TransferFailed();
        }
        (bool okR,) = recipient.call{value: msg.value - fee}("");
        if (!okR) revert TransferFailed();
        emit Tipped(msg.sender, recipient, msg.value - fee, fee);
    }

    /// @dev Reject plain transfers: every tip must go through tip().
    receive() external payable {
        revert("use tip()");
    }
}
