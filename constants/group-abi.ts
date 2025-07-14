export const groupAbi = [
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
				"name": "_creator",
				"type": "address"
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
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "AlreadyFinalized",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "AlreadyRefused",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "AlreadyValidated",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "CannotRemoveCreator",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "CodeMismatch",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "GroupAlreadyClosedOrClosing",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "GroupNotLive",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "GroupNotReadyForReimbursements",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidExpenseId",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NoParticipantsProvided",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotAllExpensesValidated",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotFactory",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotParticipant",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotPayer",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotValidator",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NothingToReimburse",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ParticipantCountMismatch",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "PermitAmountTooLow",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "USDCTransferFailed",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "expenseId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "int256",
				"name": "share",
				"type": "int256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "payer",
				"type": "address"
			}
		],
		"name": "ExpenseFinalized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "expenseId",
				"type": "uint256"
			}
		],
		"name": "ExpenseRemoved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "expenseId",
				"type": "uint256"
			}
		],
		"name": "ExpenseUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "participant",
				"type": "address"
			}
		],
		"name": "ParticipantRemoved",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_label",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_payer",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "_validators",
				"type": "address[]"
			}
		],
		"name": "addExpense",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
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
				"internalType": "bytes32",
				"name": "_code",
				"type": "bytes32"
			}
		],
		"name": "addParticipants",
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
		"inputs": [],
		"name": "closeGroup",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCreator",
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
				"internalType": "uint256",
				"name": "_expenseId",
				"type": "uint256"
			}
		],
		"name": "getExpense",
		"outputs": [
			{
				"internalType": "string",
				"name": "label",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "payer",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "validators",
				"type": "address[]"
			},
			{
				"internalType": "uint8[]",
				"name": "validationsStatus",
				"type": "uint8[]"
			},
			{
				"internalType": "bool",
				"name": "fullyValidated",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getExpenses",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "label",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "payer",
						"type": "address"
					},
					{
						"internalType": "address[]",
						"name": "validators",
						"type": "address[]"
					},
					{
						"internalType": "uint8[]",
						"name": "validationsStatus",
						"type": "uint8[]"
					},
					{
						"internalType": "bool",
						"name": "fullyValidated",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct ChillSplitGroup.ExpenseView[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getGroupCode",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getGroupDetails",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "enum ChillSplitGroup.GroupState",
				"name": "",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getParticipants",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			},
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			},
			{
				"internalType": "int256[]",
				"name": "",
				"type": "int256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getParticipantsForFactory",
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
		"inputs": [],
		"name": "isAllSettled",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
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
			},
			{
				"internalType": "uint256",
				"name": "_expenseId",
				"type": "uint256"
			}
		],
		"name": "isExpenseValidator",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_expenseId",
				"type": "uint256"
			},
			{
				"internalType": "uint8",
				"name": "value",
				"type": "uint8"
			}
		],
		"name": "isFullyValidatedOrRefused",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
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
		"name": "isParticipant",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_expenseId",
				"type": "uint256"
			}
		],
		"name": "refuseExpense",
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
		"inputs": [],
		"name": "reimburse",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			},
			{
				"internalType": "uint8",
				"name": "v",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "r",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "reimburseWithPermit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_expenseId",
				"type": "uint256"
			}
		],
		"name": "removeExpense",
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
				"internalType": "address",
				"name": "_participant",
				"type": "address"
			}
		],
		"name": "removeParticipant",
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
				"internalType": "uint256",
				"name": "_expenseId",
				"type": "uint256"
			}
		],
		"name": "validateExpense",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]