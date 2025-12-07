// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract FraudAlerts {
    /* -------------------------------------------------------------------------- */
    /*                                   STORAGE                                  */
    /* -------------------------------------------------------------------------- */

    struct Report {
        address reporter;
        address wallet;
        bytes32 evidenceHash;
        uint8 score; // 0–100
        uint40 timestamp;
        bool resolved;
        uint32 votesFor;
        uint32 votesAgainst;
    }

    struct VoteInfo {
        bool voted;
        bool support;
    }

    address public immutable owner;
    IERC20 public immutable token;

    uint256 public reportCount;

    mapping(uint256 => Report) public reports;
    mapping(address => uint256) public stakes;
    mapping(uint256 => mapping(address => VoteInfo)) public votes; // reportId => voter => vote

    /* -------------------------------------------------------------------------- */
    /*                                    EVENTS                                  */
    /* -------------------------------------------------------------------------- */

    event ReportCreated(
        uint256 indexed id,
        address indexed reporter,
        address indexed wallet,
        uint8 score,
        bytes32 evidenceHash
    );

    event ReportVoted(
        uint256 indexed id,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ReportResolved(
        uint256 indexed id,
        bool valid,
        uint32 votesFor,
        uint32 votesAgainst
    );

    event StakeAdded(address indexed user, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);

    /* -------------------------------------------------------------------------- */
    /*                                   MODIFIERS                                */
    /* -------------------------------------------------------------------------- */

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier validReport(uint256 id) {
        require(id > 0 && id <= reportCount, "invalid report");
        _;
    }

    /* -------------------------------------------------------------------------- */
    /*                                   CONSTRUCTOR                              */
    /* -------------------------------------------------------------------------- */

    constructor(address tokenAddress) {
        owner = msg.sender;
        token = IERC20(tokenAddress);
    }

    /* -------------------------------------------------------------------------- */
    /*                                    ACTIONS                                 */
    /* -------------------------------------------------------------------------- */

    // Create a fraud report
    function reportSuspicious(
        address wallet,
        bytes32 evidenceHash,
        uint8 score
    ) external {
        require(wallet != address(0), "invalid wallet");
        require(score <= 100, "score out of range");

        reportCount++;
        reports[reportCount] = Report({
            reporter: msg.sender,
            wallet: wallet,
            evidenceHash: evidenceHash,
            score: score,
            timestamp: uint40(block.timestamp),
            resolved: false,
            votesFor: 0,
            votesAgainst: 0
        });

        emit ReportCreated(reportCount, msg.sender, wallet, score, evidenceHash);
    }

    // Stake tokens to get voting weight
    function stake(uint256 amount) external {
        require(amount > 0, "stake > 0");
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");

        stakes[msg.sender] += amount;
        emit StakeAdded(msg.sender, amount);
    }

    // Optional: allow withdrawal of stake
    function withdrawStake(uint256 amount) external {
        require(stakes[msg.sender] >= amount, "not enough stake");

        stakes[msg.sender] -= amount;
        require(token.transfer(msg.sender, amount), "transfer failed");

        emit StakeWithdrawn(msg.sender, amount);
    }

    // Vote on a report
    function voteReport(uint256 id, bool support)
        external
        validReport(id)
    {
        require(stakes[msg.sender] > 0, "no stake = no vote");

        Report storage r = reports[id];
        require(!r.resolved, "already resolved");

        VoteInfo storage v = votes[id][msg.sender];
        require(!v.voted, "already voted");

        // Mark vote
        v.voted = true;
        v.support = support;

        uint256 weight = stakes[msg.sender];

        if (support) {
            r.votesFor += uint32(weight);
        } else {
            r.votesAgainst += uint32(weight);
        }

        emit ReportVoted(id, msg.sender, support, weight);
    }

    // Resolve report
    function resolveReport(uint256 id)
        external
        onlyOwner
        validReport(id)
    {
        Report storage r = reports[id];
        require(!r.resolved, "already resolved");

        r.resolved = true;
        bool valid = r.votesFor >= r.votesAgainst;

        emit ReportResolved(id, valid, r.votesFor, r.votesAgainst);
    }

    /* -------------------------------------------------------------------------- */
    /*                                   VIEW FUNCTIONS                           */
    /* -------------------------------------------------------------------------- */

    function getReport(uint256 id)
        external
        view
        validReport(id)
        returns (Report memory)
    {
        return reports[id];
    }

    function getUserVote(uint256 id, address user)
        external
        view
        returns (VoteInfo memory)
    {
        return votes[id][user];
    }

    function userStaked(address user) external view returns (uint256) {
        return stakes[user];
    }
}