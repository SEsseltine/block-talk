// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {UUPSUpgradeable} from "solady/utils/UUPSUpgradeable.sol";
import {Ownable} from "solady/auth/Ownable.sol";

contract BlockTalkMessenger is UUPSUpgradeable, Ownable {
    struct Message {
        address sender;
        address recipient;
        string encryptedContent;
        uint256 timestamp;
        bool isPermanent;
    }

    mapping(address => bytes32) public messagingPublicKeys;
    mapping(bytes32 => Message) public permanentMessages;
    mapping(address => bytes32[]) public userPermanentMessages;

    uint256 public messageCounter;
    uint256 public permanentMessageFee;

    event PublicKeyRegistered(address indexed user, bytes32 indexed publicKey);

    event ConversationMessage(
        bytes32 indexed conversationHash,
        address indexed sender,
        address indexed recipient,
        string encryptedContent,
        uint256 timestamp,
        bool isPermanent,
        bytes32 messageId
    );

    event PermanentMessageStored(
        bytes32 indexed messageId,
        address indexed sender,
        address indexed recipient
    );

    error NotRegistered(address user);
    error RecipientNotRegistered(address recipient);
    error InsufficientFee(uint256 required, uint256 provided);
    error MessageNotFound(bytes32 messageId);
    error UnauthorizedAccess(address user, bytes32 messageId);

    function initialize(uint256 _permanentMessageFee) public {
        _initializeOwner(msg.sender);
        permanentMessageFee = _permanentMessageFee;
    }

    function registerPublicKey(bytes32 _publicKey) external {
        messagingPublicKeys[msg.sender] = _publicKey;
        emit PublicKeyRegistered(msg.sender, _publicKey);
    }

    function sendMessage(
        address _recipient,
        string calldata _encryptedContent,
        bool _makePermanent
    ) external payable {
        if (messagingPublicKeys[msg.sender] == bytes32(0)) {
            revert NotRegistered(msg.sender);
        }

        if (messagingPublicKeys[_recipient] == bytes32(0)) {
            revert RecipientNotRegistered(_recipient);
        }

        if (_makePermanent && msg.value < permanentMessageFee) {
            revert InsufficientFee(permanentMessageFee, msg.value);
        }

        bytes32 messageId = keccak256(
            abi.encodePacked(
                msg.sender,
                _recipient,
                _encryptedContent,
                block.timestamp,
                messageCounter++
            )
        );

        // Create deterministic conversation hash (smaller address first for consistency)
        bytes32 conversationHash = _recipient < msg.sender
            ? keccak256(abi.encodePacked(_recipient, msg.sender))
            : keccak256(abi.encodePacked(msg.sender, _recipient));

        emit ConversationMessage(
            conversationHash,
            msg.sender,
            _recipient,
            _encryptedContent,
            block.timestamp,
            _makePermanent,
            messageId
        );

        if (_makePermanent) {
            Message storage message = permanentMessages[messageId];
            message.sender = msg.sender;
            message.recipient = _recipient;
            message.encryptedContent = _encryptedContent;
            message.timestamp = block.timestamp;
            message.isPermanent = true;

            userPermanentMessages[msg.sender].push(messageId);
            userPermanentMessages[_recipient].push(messageId);

            emit PermanentMessageStored(messageId, msg.sender, _recipient);
        }
    }

    function getMessage(
        bytes32 _messageId
    ) external view returns (Message memory) {
        Message memory message = permanentMessages[_messageId];

        if (message.sender == address(0)) {
            revert MessageNotFound(_messageId);
        }

        if (msg.sender != message.sender && msg.sender != message.recipient) {
            revert UnauthorizedAccess(msg.sender, _messageId);
        }

        return message;
    }

    function getUserPermanentMessages(
        address _user
    ) external view returns (bytes32[] memory) {
        return userPermanentMessages[_user];
    }

    function getPublicKey(address _user) external view returns (bytes32) {
        return messagingPublicKeys[_user];
    }

    function isRegistered(address _user) external view returns (bool) {
        return messagingPublicKeys[_user] != bytes32(0);
    }

    function setPermanentMessageFee(uint256 _newFee) external onlyOwner {
        permanentMessageFee = _newFee;
    }

    function withdrawFees() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}(
            ""
        );
        require(success, "Transfer failed");
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
