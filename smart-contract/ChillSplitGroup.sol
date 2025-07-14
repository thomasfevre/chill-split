// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

// Custom error definitions
error NotParticipant();
error NotValidator();
error ParticipantCountMismatch();
error GroupNotLive();
error PayerCannotValidate();
error AlreadyValidated();
error AlreadyRefused();
error AlreadyFinalized();
error GroupAlreadyClosedOrClosing();
error NotAllExpensesValidated();
error GroupNotReadyForReimbursements();
error NothingToReimburse();
error USDCTransferFailed();
error CodeMismatch();
error NoParticipantsProvided();
error InvalidExpenseId();
error NotFactory();
error CannotRemoveCreator();
error NotPayer();
error PermitAmountTooLow();

contract ChillSplitGroup {
    address private factory;
    enum GroupState {
        Live,
        ToBeClosed,
        Closed
    }
    GroupState private groupState;

    struct Expense {
        string label;
        uint256 amount;
        address payer;
        address[] validators;
        mapping(address => uint8) validations;
        bool fullyValidated;
        bool isDeleted;
        uint256 timestamp;
    }

    struct ExpenseView {
        string label;
        uint256 amount;
        address payer;
        address[] validators;
        uint8[] validationsStatus;
        bool fullyValidated;
        uint256 timestamp;
    }

    string private groupName;
    bytes32 private groupCode;
    address[] private participants;
    address private creator;
    uint256 private createdAt;
    IERC20 private usdcToken;
    uint8 private decimals = 6;

    uint256 private expenseCount;
    mapping(uint256 => Expense) private expenses;
    mapping(address => int256) private userBalances; // int256: positive or negative
    mapping(address => uint256) private reimbursements; // How much each participant owes
    mapping(address => string) private usernames;

    
    event ParticipantRemoved(address participant);
    event ExpenseRemoved(uint256 indexed expenseId);
    event ExpenseUpdated(uint256 indexed expenseId);
    event ExpenseFinalized(uint256 indexed expenseId, uint256 amount, int256 share, address payer);

    modifier onlyParticipant() {
        if (!isParticipant(msg.sender)) {
            revert NotParticipant();
        }
        _;
    }

    constructor(
        string memory _name,
        bytes32 _code,
        address[] memory _participants,
        string[] memory _usernames,
        address _creator,
        address _usdcToken,
        uint8 _decimals
    ) {
        if ((_participants.length) != _usernames.length) {
            revert ParticipantCountMismatch();
        }

        groupName = _name;
        groupCode = _code;
        participants = _participants;
        creator = _creator;
        usdcToken = IERC20(_usdcToken);
        if (_decimals != decimals) {
            decimals = _decimals;
        }
        groupState = GroupState.Live;
        for (uint256 i = 0; i < _participants.length; i++) {
            usernames[participants[i]] = _usernames[i];
            userBalances[participants[i]] = 0;
        }
        factory = msg.sender;
        createdAt = block.timestamp;
    }

    function isParticipant(address _user) public view returns (bool) {
        if (_user == creator) return true;
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i] == _user) return true;
        }
        return false;
    }

    function isExpenseValidator(address _user, uint256 _expenseId)
        public
        view
        returns (bool)
    {
        Expense storage expense = expenses[_expenseId];
        for (uint256 i = 0; i < expense.validators.length; i++) {
            if (expense.validators[i] == _user) return true;
        }
        return false;
    }

    function addExpense(
        string memory _label,
        uint256 _amount,
        address _payer,
        address[] memory _validators
    ) external onlyParticipant {
        if (groupState != GroupState.Live) {
            revert GroupNotLive();
        }

        Expense storage newExpense = expenses[expenseCount];
        newExpense.label = _label;
        newExpense.amount = _amount;
        newExpense.payer = _payer;
        newExpense.validators = _validators;
        newExpense.timestamp = block.timestamp;

        newExpense.validations[msg.sender] = 1;

        expenseCount++;
    }


    function removeExpense(uint256 _expenseId)
        external
        onlyParticipant
        returns (bool)
    {
        if (groupState != GroupState.Live) {
            revert GroupNotLive();
        }

        if (_expenseId >= expenseCount) {
            revert InvalidExpenseId();
        }

        Expense storage expense = expenses[_expenseId];

        if (expense.payer != msg.sender) {
            revert NotPayer();
        }

        if (expense.fullyValidated) {
            uint256 share = expense.amount / (expense.validators.length + 1);
            userBalances[expense.payer] -= int256(expense.amount - share);
            for (uint256 i = 0; i < expense.validators.length; i++) {
                userBalances[expense.validators[i]] += int256(share);
            }
        }

        delete expenses[_expenseId];
        emit ExpenseRemoved(_expenseId);
        return true;
    }


    function refuseExpense(uint256 _expenseId)
        external
        onlyParticipant
        returns (bool)
    {
        if (_expenseId >= expenseCount) {
            revert InvalidExpenseId();
        }

        Expense storage expense = expenses[_expenseId];

        if (expense.validations[msg.sender] == 3) {
            revert AlreadyRefused();
        }

        bool isValidator = false;
        for (uint256 i = 0; i < expense.validators.length; i++) {
            if (expense.validators[i] == msg.sender) {
                isValidator = true;
                break;
            }
        }
        if (!isValidator) {
            revert NotValidator();
        }

        expense.validations[msg.sender] = 3;

        if (isFullyValidatedOrRefused(_expenseId, 3)) {
            expense.isDeleted = true;
            emit ExpenseRemoved(_expenseId);
        }

        return true;
    }

    function validateExpense(uint256 _expenseId)
        external
        onlyParticipant
    {
        Expense storage expense = expenses[_expenseId];

        if (expense.validations[msg.sender] == 1) {
            revert AlreadyValidated();
        }

        bool isValidator = false;
        for (uint256 i = 0; i < expense.validators.length; i++) {
            if (expense.validators[i] == msg.sender) {
                isValidator = true;
            }
        }
        if (!isValidator) {
            revert NotValidator();
        }

        expense.validations[msg.sender] = 1;

        if (isFullyValidatedOrRefused(_expenseId, 1)) {
            finalizeExpense(_expenseId);
        }
    }

    function finalizeExpense(uint256 _expenseId) internal {
        Expense storage expense = expenses[_expenseId];
        if (expense.fullyValidated) {
            revert AlreadyFinalized();
        }

        expense.fullyValidated = true;

        uint256 share = expense.amount / expense.validators.length;
        userBalances[expense.payer] += (int256(share) * int256(expense.validators.length - 1));

        for (uint256 i = 0; i < expense.validators.length; i++) {
            if (expense.payer != expense.validators[i]){
                userBalances[expense.validators[i]] -= int256(share);
            }
        }

        emit ExpenseFinalized(_expenseId, share, userBalances[expense.payer], expense.payer);
    }

    function isFullyValidatedOrRefused(uint256 _expenseId, uint8 value)
        public
        view
        returns (bool)
    {
        Expense storage expense = expenses[_expenseId];
        for (uint256 i = 0; i < expense.validators.length; i++) {
            if (expense.validations[expense.validators[i]] != value) {
                return false;
            }
        }
        return true;
    }

    function closeGroup()
        external
        onlyParticipant
    {
        if (groupState != GroupState.Live) {
            revert GroupAlreadyClosedOrClosing();
        }

        // require that every expense is validated
        for (uint256 i = 0; i < expenseCount; i++) {
            if (!isFullyValidatedOrRefused(i, 1)) {
                revert NotAllExpensesValidated();
            }
        }
        groupState = GroupState.ToBeClosed;
    }

    function reimburse()
        external
        onlyParticipant
    {
        if (groupState != GroupState.ToBeClosed) {
            revert GroupNotReadyForReimbursements();
        }

        int256 balance = userBalances[msg.sender];
        if (balance >= 0) {
            revert NothingToReimburse();
        }

        uint256 amountToReimburse = uint256(-balance); // Make it positive

        bool transferSuccess = usdcToken.transferFrom(
            msg.sender,
            address(this),
            amountToReimburse
        );

        if (!transferSuccess) {
            revert USDCTransferFailed();
        }

        userBalances[msg.sender] = 0; // Mark as paid

        // When all amounts are on the contract
        if (isAllSettled()) {
            // Transfer USDC to all user that have a balance > 0 (bc they owes money)
            for (uint256 i = 0; i < participants.length; i++) {
                if (userBalances[participants[i]] > 0) {
                    usdcToken.transfer(
                        participants[i],
                        uint256(userBalances[participants[i]])
                    );
                    userBalances[participants[i]] = 0;
                }
            }
            groupState = GroupState.Closed;
        }
    }

    function reimburseWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyParticipant {
        if (groupState != GroupState.ToBeClosed) {
            revert GroupNotReadyForReimbursements();
        }

        int256 balance = userBalances[msg.sender];
        if (balance >= 0) {
            revert NothingToReimburse();
        }

        uint256 amountToReimburse = uint256(-balance);
        if (amount < amountToReimburse) {
            revert PermitAmountTooLow();
        }

        uint256 amountWithDecimals = amountToReimburse * 10 ** decimals / 100;

        // 1. Execute the permit
        IERC20Permit(address(usdcToken)).permit(
            msg.sender,
            address(this),
            amountWithDecimals,
            deadline,
            v,
            r,
            s
        );

        // 2. Transfer
        bool success = usdcToken.transferFrom(
            msg.sender,
            address(this),
            amountWithDecimals
        );
        if (!success) {
            revert USDCTransferFailed();
        }

        userBalances[msg.sender] = 0;

        // 3. Distribute to positive balance holders
        if (isAllSettled()) {
            for (uint256 i = 0; i < participants.length; i++) {
                int256 ub = userBalances[participants[i]];
                if (ub > 0) {
                    userBalances[participants[i]] = 0;
                    usdcToken.transfer(participants[i], uint256(ub) * 10 ** decimals / 100);
                }
            }
            groupState = GroupState.Closed;
        }
    }


    function isAllSettled() public view returns (bool) {
        if (groupState != GroupState.ToBeClosed) return false;
        for (uint256 i = 0; i < participants.length; i++) {
            if (userBalances[participants[i]] < 0) {
                return false;
            }
        }
        return true;
    }

    function getParticipants()
        external
        view
        returns (address[] memory, string[] memory, int[] memory)
    {
        uint256 len = participants.length;
        string[] memory pseudos = new string[](len);
        int[] memory balances = new int[](len);

        for (uint256 i = 0; i < len; i++) {
            pseudos[i] = usernames[participants[i]];
            balances[i] = userBalances[participants[i]];
        }

        return (participants, pseudos, balances);
    }

    function getParticipantsForFactory() external view returns (address[] memory) {
        if (msg.sender != factory) {
            revert NotFactory();
        }
        return participants;
    }

    function addParticipants(
        address[] memory _participants,
        string[] memory _usernames,
        bytes32 _code
    ) public returns (bool) {
        if (msg.sender != factory) {
            revert NotFactory();
        }

        if (_code != groupCode) {
            revert CodeMismatch();
        }

        if (groupState != GroupState.Live) {
            revert GroupNotLive();
        }

        if (_participants.length == 0) {
            revert NoParticipantsProvided();
        }

        // Add new participants to the end of array
        for (uint256 i = 0; i < _participants.length; i++) {
            if (_participants[i] == creator) continue;

            bool isDuplicate = false;
            for (uint256 j = participants.length; j > 0; j--) {
                if (_participants[i] == participants[j - 1]) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                participants.push(_participants[i]);
                usernames[_participants[i]] = _usernames[i];
            }
        }
        return true;
    }

    function removeParticipant(address _participant)
        public
        returns (bool)
    {
        if (msg.sender != factory) {
            revert NotFactory();
        }
        
        if(!isParticipant(_participant)) {
            revert NotParticipant();
        }

        if (groupState != GroupState.Live) {
            revert GroupNotLive();
        }

        if (_participant == creator) {
            revert CannotRemoveCreator();
        }

        // Cleanup all expenses
        for (uint256 i = 0; i < expenseCount; i++) {
            Expense storage exp = expenses[i];

            bool modified = false;

            // Case 1: Participant is payer
            if (exp.payer == _participant) {
                if (exp.fullyValidated) {
                    uint256 share = exp.amount / (exp.validators.length + 1);
                    userBalances[exp.payer] -= int256(exp.amount - share);
                    for (uint256 j = 0; j < exp.validators.length; j++) {
                        userBalances[exp.validators[j]] += int256(share);
                    }
                }

                delete expenses[i];
                emit ExpenseRemoved(i);
                continue;
            }

            // Case 2: Participant is a validator
            for (uint256 j = 0; j < exp.validators.length; j++) {
                if (exp.validators[j] == _participant) {
                    // If finalized, reverse the effect of the old expense
                    if (exp.fullyValidated) {
                        uint256 oldShare = exp.amount /
                            (exp.validators.length + 1);
                        userBalances[exp.payer] -= int256(oldShare); // Revert part of payer's gain
                        userBalances[_participant] += int256(oldShare);
                    }

                    // Remove validator from array
                    exp.validators[j] = exp.validators[
                        exp.validators.length - 1
                    ];
                    exp.validators.pop();
                    delete exp.validations[_participant];

                    // Re-finalize expense with updated validators
                    if (exp.fullyValidated) {
                        uint256 newShare = exp.amount /
                            (exp.validators.length + 1);
                        userBalances[exp.payer] += int256(
                            exp.amount - newShare
                        );
                        for (uint256 k = 0; k < exp.validators.length; k++) {
                            userBalances[exp.validators[k]] -= int256(newShare);
                        }
                    }

                    modified = true;
                    break;
                }
            }

            if (modified) {
                emit ExpenseUpdated(i);
            }
        }

        // Remove from participants
        uint256 len = participants.length;
        for (uint256 i = 0; i < len; i++) {
            if (participants[i] == _participant) {
                participants[i] = participants[len - 1];
                participants.pop();
                delete usernames[_participant];
                break;
            }
        }

        emit ParticipantRemoved(_participant);
        return true;
    }

    function getGroupDetails()
        external
        view
        onlyParticipant
        returns (
            string memory,
            address,
            GroupState,
            uint256
        )
    {
        return (groupName, creator, groupState, createdAt);
    }

    function getGroupCode() external view onlyParticipant returns (bytes32) {
        return groupCode;
    }
    
    function getCreator() external view returns (address) {
        return creator;
    }

    function getExpense(uint256 _expenseId)
        public
        view
        returns (
            string memory label,
            uint256 amount,
            address payer,
            address[] memory validators,
            uint8[] memory validationsStatus,
            bool fullyValidated,
            uint256 timestamp
        )
    {
        if (_expenseId >= expenseCount) {
            revert InvalidExpenseId();
        }

        Expense storage expense = expenses[_expenseId];

        uint256 validatorsLength = expense.validators.length;
        uint8[] memory validationsArray = new uint8[](validatorsLength);

        for (uint256 i = 0; i < validatorsLength; i++) {
            validationsArray[i] = expense.validations[expense.validators[i]];
        }

        return (
            expense.label,
            expense.amount,
            expense.payer,
            expense.validators,
            validationsArray,
            expense.fullyValidated,
            expense.timestamp
        );
    }

    function getExpenses() external view returns (ExpenseView[] memory) {
        ExpenseView[] memory expenseViews = new ExpenseView[](expenseCount);

        for (uint256 i = 0; i < expenseCount; i++) {
            Expense storage exp = expenses[i];

            if (exp.isDeleted) continue;
            uint256 validatorsLength = exp.validators.length;
            uint8[] memory validationsArray = new uint8[](validatorsLength);

            for (uint256 j = 0; j < validatorsLength; j++) {
                validationsArray[j] = exp.validations[exp.validators[j]];
            }

            expenseViews[i] = ExpenseView({
                label: exp.label,
                amount: exp.amount,
                payer: exp.payer,
                validators: exp.validators,
                validationsStatus: validationsArray,
                fullyValidated: exp.fullyValidated,
                timestamp: exp.timestamp
            });
        }

        return expenseViews;
    }
}