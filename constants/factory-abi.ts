export const factoryAbi = [
	{
		"inputs": [],
		"name": "FailedToAddGroupMembers",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "FailedToRemoveGroupMembers",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "GroupCodeAlreadyExists",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "GroupCodeDoesNotExist",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotGroupCreator",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ParticipantCountMismatch",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "groupAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "name",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "code",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			}
		],
		"name": "GroupCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "bytes32",
				"name": "_code",
				"type": "bytes32"
			},
			{
				"internalType": "address[]",
				"name": "_participants",
				"type": "address[]"
			},
			{
				"internalType": "string[]",
				"name": "_usernames",
				"type": "string[]"
			},
			{
				"internalType": "address",
				"name": "_usdcToken",
				"type": "address"
			},
			{
				"internalType": "uint8",
				"name": "_decimals",
				"type": "uint8"
			}
		],
		"name": "createGroup",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_code",
				"type": "bytes32"
			}
		],
		"name": "deleteGroup",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_code",
				"type": "bytes32"
			}
		],
		"name": "getGroupAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getGroupsByUser",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_code",
				"type": "bytes32"
			},
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			}
		],
		"name": "joinGroup",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_groupAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_participantToRemove",
				"type": "address"
			}
		],
		"name": "removeParticipant",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]