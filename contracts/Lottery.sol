pragma solidity >=0.4.22 <0.7.0;

contract Lottery {
    uint256 public numberOfGames;
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => uint256)) public userContributions;
    mapping(uint256 => mapping(uint256 => address payable)) public users;
    address public creator;

    constructor(address _creator) public {
        creator = _creator;
        numberOfGames = 0;
    }

    struct Game {
        uint256 gameNumber;
        uint256 prizePool;
        uint256 numberOfUsers;
        address winner;
        bool finished;
    }

    event GameStarted(uint256 gameNumber);

    event GameFinished(
        uint256 gameNumber,
        uint256 prizePool,
        address payable winner
    );

    event Joined(
        uint256 currentPrizePool,
        uint256 userContribution,
        address user
    );

    function startGame() public {
        require(msg.sender == creator, "Only the creator can start a game.");
        require(
            numberOfGames == 0 || games[numberOfGames].finished == true,
            "Previous game isnt finished"
        );
        numberOfGames += 1;
        emit GameStarted(numberOfGames);
    }

    function selectWinner(uint256 randomNumber, bool startNewGame) public {
        require(msg.sender == creator, "Only the creator can call the game.");
        require(games[numberOfGames].numberOfUsers != 0, "Cannot end game with no participants");
        Game storage currentGame = games[numberOfGames];
        uint256 currentUser = 0;
        uint256 currentSum = 0;
        while (currentSum <= randomNumber) {
            currentUser += 1;
            currentSum += userContributions[numberOfGames][users[numberOfGames][currentUser]];
        }
        address payable w = users[numberOfGames][currentUser];

        //send money to winner
        w.transfer(games[numberOfGames].prizePool);
        games[numberOfGames].winner = w;
        games[numberOfGames].finished = true;
        emit GameFinished(numberOfGames, currentGame.prizePool, w);

        if (startNewGame == true) {
            startGame();
        }
    }

    function joinGame() public payable {
        require(msg.value != 0, "You can only join if you pay.");
        uint256 newNum = games[numberOfGames].numberOfUsers + 1;
        games[numberOfGames].numberOfUsers = newNum;
        users[numberOfGames][newNum] = msg.sender;
        userContributions[numberOfGames][msg.sender] = msg.value;
        games[numberOfGames].prizePool += msg.value;
        emit Joined(games[numberOfGames].prizePool, msg.value, msg.sender);
    }

}
