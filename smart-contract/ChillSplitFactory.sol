// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ChillSplitGroup.sol";

// Custom error definitions
error GroupCodeAlreadyExists();
error GroupCodeDoesNotExist();
error FailedToAddGroupMembers();
error FailedToRemoveGroupMembers();
error NotGroupCreator();

contract ChillSplitFactory {
    mapping(address => address[]) private groupsByUser;
    mapping(bytes32 => address) private groupCodeToAddress;

    event GroupCreated(address indexed groupAddress, bytes32 name, bytes32 code, address creator);

    function createGroup(string memory _name, bytes32 _code, address[] memory _participants, string[] memory _usernames,
                         address _usdcToken, uint8 _decimals) external {
        if (groupCodeToAddress[_code] != address(0)) {
            revert GroupCodeAlreadyExists();
        }
        
        if ((_participants.length) != _usernames.length) {
            revert ParticipantCountMismatch();
        }

        ChillSplitGroup newGroup = new ChillSplitGroup(_name, _code, _participants, _usernames, msg.sender, _usdcToken, _decimals);

        groupCodeToAddress[_code] = address(newGroup);

        for (uint i = 0; i < _participants.length; i++) {
            address p = _participants[i];
            groupsByUser[p].push(address(newGroup));
        }
        groupsByUser[msg.sender].push(address(newGroup));


        emit GroupCreated(address(newGroup), keccak256(bytes(_name)), _code, msg.sender);
    }

    function joinGroup(bytes32 _code, string memory _username) external {
        if (groupCodeToAddress[_code] == address(0)) {
            revert GroupCodeDoesNotExist();
        }
        
        address groupAddress = groupCodeToAddress[_code];
        address[] memory newParticipants = new address[](1);
        newParticipants[0] = msg.sender;
        string[] memory newUsernames = new string[](1);
        newUsernames[0] = _username;

        groupsByUser[msg.sender].push(groupAddress);

        bool success = ChillSplitGroup(groupAddress).addParticipants(newParticipants, newUsernames, _code);
        if (!success) {
            revert FailedToAddGroupMembers();
        }
    }

    function removeParticipant(address _groupAddress, address _participantToRemove) external {
        address creator = ChillSplitGroup(_groupAddress).getCreator();
        
        if (msg.sender != creator || msg.sender != _participantToRemove) {
            revert NotGroupCreator();
        }

        address[] storage groups = groupsByUser[_participantToRemove];
        for (uint j = 0; j < groups.length; j++) {
            if (groups[j] == _groupAddress) {
                groups[j] = groups[groups.length - 1];
                groups.pop();
                break;
            }
        }

        bool success = ChillSplitGroup(_groupAddress).removeParticipant(_participantToRemove);
        if (!success) {
            revert FailedToRemoveGroupMembers();
        }
    }

    function getGroupsByUser(address _user) external view returns (address[] memory) {
        return groupsByUser[_user];
    }

    function getGroupAddress(bytes32 _code) public view returns (address) {
        return groupCodeToAddress[_code];
    }

    function deleteGroup(bytes32 _code) external returns (bool) {
        address groupAddress = groupCodeToAddress[_code];
        if (groupAddress == address(0)) revert GroupCodeDoesNotExist();

        address creator = ChillSplitGroup(groupAddress).getCreator();
        if(msg.sender != creator) revert NotGroupCreator();

        // Fetch the participant list directly from the group contract
        address[] memory participants_ = ChillSplitGroup(groupAddress).getParticipantsForFactory();

        // Remove from groupCodeToAddress
        delete groupCodeToAddress[_code];

        // Remove from each user’s group list
        for (uint i = 0; i < participants_.length; i++) {
            address[] storage groups = groupsByUser[participants_[i]];
            for (uint j = 0; j < groups.length; j++) {
                if (groups[j] == groupAddress) {
                    groups[j] = groups[groups.length - 1];
                    groups.pop();
                    break;
                }
            }
        }

        return true;
    }
}
