pragma solidity >=0.4.22 <0.7.0;

contract Lottery {
    uint numberOfGames;
    mapping(uint => Game) games;
    address creator;

    constructor(address _creator) public {
        creator = _creator;
        numberOfGames = 0;
    }

    struct Game {
        uint gameNumber;
        uint prizePool;
        uint numberOfUsers;
        mapping(address => uint) usersContribution;
        mapping(uint => address payable) users;
        address winner;
        bool finished;
    }

    event GameStarted(
        uint gameNumber
        );

    event GameFinished(
        uint gameNumber,
        uint prizePool,
        address payable winner
        );

    event Joined(
        uint currentPrizePool,
        uint userContribution,
        address user
        );

    function startGame() public {
        require(
            msg.sender == creator,
            "Only the creator can start a game."
        );
        require(numberOfGames == 0 || games[numberOfGames].finished == true, "Previous game isnt finished");
        numberOfGames += 1;
        emit GameStarted(numberOfGames);
    }

    function selectWinner(uint randomNumber, bool startNewGame) public {
        require(
            msg.sender == creator,
            "Only the creator can call the game."
        );
        Game storage currentGame = games[numberOfGames];
        uint currentUser = 0;
        uint currentSum = 0;
        while(currentSum <= randomNumber) {
            currentUser += 1;
            currentSum += currentGame.usersContribution[currentGame.users[currentUser]];
        }
        address payable w = currentGame.users[currentUser];

        //send money to winner
        w.transfer(games[numberOfGames].prizePool);
        games[numberOfGames].winner = w;
        games[numberOfGames].finished = true;
        emit GameFinished(numberOfGames, currentGame.prizePool,  w);

        if(startNewGame == true) {
            startGame();
        }
    }

    function joinGame () payable public {
        require(msg.value != 0, "You can only join if you pay.");
        uint newNum = games[numberOfGames].numberOfUsers + 1;
        games[numberOfGames].numberOfUsers = newNum;
        games[numberOfGames].users[newNum] = msg.sender;
        games[numberOfGames].usersContribution[msg.sender] = msg.value;
        games[numberOfGames].prizePool += msg.value;
        emit Joined(games[numberOfGames].prizePool, msg.value, msg.sender);
    }

}