// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ChillSplitGroup.sol";

// Custom error definitions
error GroupCodeAlreadyExists();
error GroupCodeDoesNotExist();
error FailedToAddGroupMembers();
error FailedToRemoveGroupMembers();
error NotAuthorized(); // Changed from NotGroupCreator for clarity
error GroupIsDeleted();

contract ChillSplitFactory {
    mapping(address => address[]) private groupsByUser;
    mapping(bytes32 => address) private groupCodeToAddress;
    mapping(address => bool) public isGroupDeleted;

    event GroupCreated(address indexed groupAddress, bytes32 name, bytes32 code, address creator);
    event GroupDeleted(address indexed groupAddress, bytes32 code);

    function createGroup(string memory _name, bytes32 _code, address[] memory _participants, string[] memory _usernames,
                         address _usdcToken, uint8 _decimals) external {
        if (groupCodeToAddress[_code] != address(0)) {
            revert GroupCodeAlreadyExists();
        }
        
        if ((_participants.length) != _usernames.length) {
            revert ParticipantCountMismatch();
        }

        ChillSplitGroup newGroup = new ChillSplitGroup(_name, _code, _participants, _usernames, msg.sender, _usdcToken, _decimals);
        address groupAddress = address(newGroup);

        groupCodeToAddress[_code] = groupAddress;

        for (uint i = 0; i < _participants.length; i++) {
            groupsByUser[_participants[i]].push(groupAddress);
        }

        emit GroupCreated(groupAddress, keccak256(bytes(_name)), _code, msg.sender);
    }

    function joinGroup(bytes32 _code, string memory _username) external {
        address groupAddress = groupCodeToAddress[_code];
        if (groupAddress == address(0)) {
            revert GroupCodeDoesNotExist();
        }
        if (isGroupDeleted[groupAddress]) {
            revert GroupIsDeleted();
        }
        
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
        
        if (msg.sender != creator && msg.sender != _participantToRemove) {
            revert NotAuthorized();
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
        address[] storage userGroups = groupsByUser[_user];
        uint activeGroupCount = 0;
        for(uint i = 0; i < userGroups.length; i++) {
            if(!isGroupDeleted[userGroups[i]]) {
                activeGroupCount++;
            }
        }

        address[] memory activeGroups = new address[](activeGroupCount);
        uint counter = 0;
        for(uint i = 0; i < userGroups.length; i++) {
            if(!isGroupDeleted[userGroups[i]]) {
                activeGroups[counter] = userGroups[i];
                counter++;
            }
        }
        return activeGroups;
    }

    function getGroupAddress(bytes32 _code) public view returns (address) {
        return groupCodeToAddress[_code];
    }

    function deleteGroup(bytes32 _code) external {
        address groupAddress = groupCodeToAddress[_code];
        if (groupAddress == address(0)) revert GroupCodeDoesNotExist();

        address creator = ChillSplitGroup(groupAddress).getCreator();
        if(msg.sender != creator) revert NotAuthorized();

        // Instead of looping through all users, we just mark the group as deleted.
        // The `getGroupsByUser` function will handle filtering (lazy cleanup).
        delete groupCodeToAddress[_code];
        isGroupDeleted[groupAddress] = true;

        emit GroupDeleted(groupAddress, _code);
    }
}
