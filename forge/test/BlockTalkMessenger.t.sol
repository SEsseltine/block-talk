// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/BlockTalkMessenger.sol";
import "solady/utils/LibClone.sol";

contract BlockTalkMessengerTest is Test {
    BlockTalkMessenger public messenger;
    BlockTalkMessenger public implementation;

    address public owner = address(0x1);
    address public alice = address(0x2);
    address public bob = address(0x3);
    address public charlie = address(0x4);

    bytes32 public alicePublicKey = keccak256("alice_public_key");
    bytes32 public bobPublicKey = keccak256("bob_public_key");

    uint256 public permanentMessageFee = 0.001 ether;

    function setUp() public {
        vm.startPrank(owner);

        implementation = new BlockTalkMessenger();

        address proxy = LibClone.deployERC1967(address(implementation));
        messenger = BlockTalkMessenger(proxy);
        messenger.initialize(permanentMessageFee);

        vm.stopPrank();
    }

    function testInitialization() public view {
        assertEq(messenger.owner(), owner);
        assertEq(messenger.permanentMessageFee(), permanentMessageFee);
        assertEq(messenger.messageCounter(), 0);
    }

    function testRegisterPublicKey() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        assertEq(messenger.getPublicKey(alice), alicePublicKey);
        assertTrue(messenger.isRegistered(alice));
    }

    function testRegisterPublicKeyEmitsEvent() public {
        vm.prank(alice);

        vm.expectEmit(true, true, false, true);
        emit BlockTalkMessenger.PublicKeyRegistered(alice, alicePublicKey);

        messenger.registerPublicKey(alicePublicKey);
    }

    function testSendMessageFailsWhenSenderNotRegistered() public {
        vm.prank(bob);
        messenger.registerPublicKey(bobPublicKey);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BlockTalkMessenger.NotRegistered.selector, alice));
        messenger.sendMessage(bob, "encrypted_message", false);
    }

    function testSendMessageFailsWhenRecipientNotRegistered() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BlockTalkMessenger.RecipientNotRegistered.selector, bob));
        messenger.sendMessage(bob, "encrypted_message", false);
    }

    function testSendTemporaryMessage() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        vm.prank(bob);
        messenger.registerPublicKey(bobPublicKey);

        vm.prank(alice);
        messenger.sendMessage(bob, "encrypted_message_for_bob", false);

        assertEq(messenger.messageCounter(), 1);
    }

    function testSendTemporaryMessageEmitsEvent() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        vm.prank(bob);
        messenger.registerPublicKey(bobPublicKey);

        vm.prank(alice);

        vm.expectEmit(true, true, true, false);
        emit BlockTalkMessenger.MessageSent(
            alice,
            bob,
            "encrypted_message_for_bob",
            block.timestamp,
            false,
            bytes32(0) // messageId will be different due to keccak256
        );

        messenger.sendMessage(bob, "encrypted_message_for_bob", false);
    }

    function testSendPermanentMessageFailsWithInsufficientFee() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        vm.prank(bob);
        messenger.registerPublicKey(bobPublicKey);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BlockTalkMessenger.InsufficientFee.selector, permanentMessageFee, 0));
        messenger.sendMessage(bob, "encrypted_message_for_bob", true);
    }

    function testSendPermanentMessage() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        vm.prank(bob);
        messenger.registerPublicKey(bobPublicKey);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        messenger.sendMessage{value: permanentMessageFee}(bob, "permanent_encrypted_message", true);

        assertEq(messenger.messageCounter(), 1);
        assertEq(address(messenger).balance, permanentMessageFee);
    }

    function testGetPermanentMessage() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        vm.prank(bob);
        messenger.registerPublicKey(bobPublicKey);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        messenger.sendMessage{value: permanentMessageFee}(bob, "permanent_encrypted_message", true);

        bytes32[] memory aliceMessages = messenger.getUserPermanentMessages(alice);
        bytes32[] memory bobMessages = messenger.getUserPermanentMessages(bob);

        assertEq(aliceMessages.length, 1);
        assertEq(bobMessages.length, 1);
        assertEq(aliceMessages[0], bobMessages[0]);

        bytes32 messageId = aliceMessages[0];

        vm.prank(alice);
        BlockTalkMessenger.Message memory message = messenger.getMessage(messageId);

        assertEq(message.sender, alice);
        assertEq(message.recipient, bob);
        assertEq(message.encryptedContent, "permanent_encrypted_message");
        assertTrue(message.isPermanent);
    }

    function testGetMessageFailsForUnauthorizedUser() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        vm.prank(bob);
        messenger.registerPublicKey(bobPublicKey);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        messenger.sendMessage{value: permanentMessageFee}(bob, "permanent_encrypted_message", true);

        bytes32[] memory aliceMessages = messenger.getUserPermanentMessages(alice);
        bytes32 messageId = aliceMessages[0];

        vm.prank(charlie);
        vm.expectRevert(abi.encodeWithSelector(BlockTalkMessenger.UnauthorizedAccess.selector, charlie, messageId));
        messenger.getMessage(messageId);
    }

    function testSetPermanentMessageFee() public {
        uint256 newFee = 0.002 ether;

        vm.prank(owner);
        messenger.setPermanentMessageFee(newFee);

        assertEq(messenger.permanentMessageFee(), newFee);
    }

    function testSetPermanentMessageFeeFailsForNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        messenger.setPermanentMessageFee(0.002 ether);
    }

    function testWithdrawFees() public {
        vm.prank(alice);
        messenger.registerPublicKey(alicePublicKey);

        vm.prank(bob);
        messenger.registerPublicKey(bobPublicKey);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        messenger.sendMessage{value: permanentMessageFee}(bob, "permanent_encrypted_message", true);

        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(owner);
        messenger.withdrawFees();

        assertEq(owner.balance, ownerBalanceBefore + permanentMessageFee);
        assertEq(address(messenger).balance, 0);
    }

    function testWithdrawFeesFailsForNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        messenger.withdrawFees();
    }
}
