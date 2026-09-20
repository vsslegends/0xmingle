// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TipSplitter} from "../src/TipSplitter.sol";

contract TipSplitterTest is Test {
    address constant TREASURY = 0xC2F0FF0f2928fc53E0e4e7B4Cf166BdC563C243b;
    TipSplitter splitter;

    function setUp() public {
        splitter = new TipSplitter(TREASURY, 500);
    }

    function test_splitsFivePercent() public {
        address recipient = makeAddr("stranger");
        address tipper = makeAddr("tipper");
        uint256 beforeT = TREASURY.balance;
        uint256 beforeR = recipient.balance;
        vm.deal(tipper, 1 ether);
        vm.prank(tipper);
        splitter.tip{value: 1 ether}(recipient);
        assertEq(TREASURY.balance - beforeT, 0.05 ether, "treasury fee");
        assertEq(recipient.balance - beforeR, 0.95 ether, "recipient share");
        assertEq(address(splitter).balance, 0, "holds no funds");
    }

    function test_zeroFeeBpsPassesEverythingThrough() public {
        TipSplitter free = new TipSplitter(TREASURY, 0);
        address recipient = makeAddr("stranger2");
        address tipper = makeAddr("tipper2");
        vm.deal(tipper, 1 ether);
        vm.prank(tipper);
        free.tip{value: 1 ether}(recipient);
        assertEq(recipient.balance, 1 ether);
    }

    function test_reverts() public {
        address tipper = makeAddr("tipper3");
        vm.deal(tipper, 1 ether);
        vm.prank(tipper);
        vm.expectRevert(TipSplitter.ZeroRecipient.selector);
        splitter.tip{value: 1 ether}(address(0));
        vm.prank(tipper);
        vm.expectRevert(TipSplitter.ZeroValue.selector);
        splitter.tip{value: 0}(makeAddr("r"));
        vm.prank(tipper);
        vm.expectRevert("use tip()");
        (bool ok,) = address(splitter).call{value: 1 ether}("");
        ok;
    }

    function testFuzz_splitAlwaysSumsToValue(uint256 value, uint256 bps) public {
        bps = bound(bps, 0, 10_000);
        value = bound(value, 1, 1_000_000 ether);
        TipSplitter s = new TipSplitter(TREASURY, bps);
        address recipient = makeAddr("fuzz-recipient");
        uint256 beforeT = TREASURY.balance;
        uint256 beforeR = recipient.balance;
        s.tip{value: value}(recipient);
        uint256 fee = (value * bps) / 10_000;
        assertEq(TREASURY.balance - beforeT, fee, "fee math");
        assertEq(recipient.balance - beforeR, value - fee, "recipient math");
        assertEq(address(s).balance, 0, "holds no funds");
    }
}
