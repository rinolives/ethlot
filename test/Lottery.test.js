const Lottery = artifacts.require("./Lottery");
import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from "./helpers";

require("chai").use(require("chai-as-promised")).should();

contract("Lottery", ([deployer, player1, player2, player3]) => {
  let lottery;

  beforeEach(async () => {
    lottery = await Lottery.new(deployer);
  });

  describe("deployment", () => {
    it("tracks the creator", async () => {
      const result = await lottery.creator();
      result.should.equal(deployer);
    });
  });

  describe("creating game", async () => {
    let result;

    beforeEach(async () => {
      result = await lottery.startGame({ from: deployer });
    });

    it("emits a new game event", async () => {
      const log = result.logs[0];
      log.event.should.eq("GameStarted");
      const event = log.args;
      event.gameNumber.toString().should.equal("1", "game number is correct");
    });
    it("counts the current game", async () => {
      let n = await lottery.numberOfGames();
      n.toString().should.eq("1", "current game is included in lottery");
    });
    it("doesnt allow a new game to be created once one is going", async () => {
      await lottery
        .startGame()
        .should.be.rejectedWith("Previous game isnt finished");
    });
  });

  describe(
    "joining game",
    async () => {
      let amount;
      let result;

      beforeEach(async () => {
        amount = ether(1);
        await lottery.startGame({ from: deployer });
        result = await lottery.joinGame({ from: player1, value: amount });
      });

      it("emits a join event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Joined");
        const event = log.args;
        event.currentPrizePool
          .toString()
          .should.equal(amount.toString(), "current prize pool is correct");
        event.userContribution
          .toString()
          .should.equal(amount.toString(), "user contribution is correct");
        event.user.should.equal(player1, "user is correct");
      });

      it("includes user in current game", async () => {
        let numGames = await lottery.numberOfGames();
        let g = await lottery.games(numGames);
        let u1 = await lottery.users(numGames, g.numberOfUsers);
        let c1 = await lottery.userContributions(numGames, u1);
        let n = await g.numberOfUsers;
        n.toString().should.eq("1", "number of users in game is correct");
        u1.should.eq(player1, "first player in game is correct");
        c1.toString().should.eq(amount.toString(), "contribution is correct");
      });

      it("lets multiple users join", async () => {
        amount = ether(2);
        let total = ether(3);
        await lottery.joinGame({ from: player2, value: amount });
        let numGames = await lottery.numberOfGames();
        let g = await lottery.games(numGames);
        let u2 = await lottery.users(numGames, g.numberOfUsers);
        let c2 = await lottery.userContributions(numGames, u2);
        let n2 = await g.numberOfUsers;
        let p = await g.prizePool;
        n2.toString().should.eq("2", "number of users in game is correct");
        u2.should.eq(player2, "second player in game is correct");
        c2.toString().should.eq(amount.toString(), "contribution is correct");
        p.toString().should.eq(total.toString(), "prize pool is correct");
      });

      it("does not let a player join without paying", async () => {
        await lottery
          .joinGame({ from: player2, value: 0 })
          .should.be.rejectedWith("You can only join if you pay.");
      });
    },

    describe("fails to select winner", async () => {
        let amount;
        let result;
  
        it("Cannot call select winner if your not the creator", async () => {
          await lottery.startGame({ from: deployer });
          await lottery
          .selectWinner(ether(0.9), true, {from: player1})
          .should.be.rejectedWith("Only the creator can call the game.");
          
        })
  
        it("Cannot call select winner with no participants", async () => {
          await lottery.startGame({ from: deployer });
          await lottery
          .selectWinner(ether(0.9), true)
          .should.be.rejectedWith("Cannot end game with no participants");
          
        })
    }),

    describe("select winner", async () => {
      let amount;
      let result;

      beforeEach(async () => {
        amount = ether(1);
        await lottery.startGame({ from: deployer });
        await lottery.joinGame({ from: player1, value: amount });
        await lottery.joinGame({ from: player2, value: amount });
        await lottery.joinGame({ from: player3, value: amount });
      });

      it("Chooses player 1 to win", async () => {
        result = await lottery.selectWinner(ether(0.9), true);
        const log = result.logs[0];
        log.event.should.eq("GameFinished");
        const event = log.args;
        event.prizePool
          .toString()
          .should.equal(ether(3).toString(), " prize pool is correct");
        event.gameNumber.toString().should.equal("1", "game number is correct");
        event.winner
          .toString()
          .should.equal(player1, " player 1 won is correct");
      });
      it("Chooses player 2 to win", async () => {
        result = await lottery.selectWinner(ether(1.9), true);
        const log = result.logs[0];
        log.event.should.eq("GameFinished");
        const event = log.args;
        event.prizePool
          .toString()
          .should.equal(ether(3).toString(), " prize pool is correct");
        event.gameNumber.toString().should.equal("1", "game number is correct");
        event.winner
          .toString()
          .should.equal(player2, " player2 won is correct");
      });
      it("Chooses player 3 to win", async () => {
        result = await lottery.selectWinner(ether(2.9), true);
        const log = result.logs[0];
        log.event.should.eq("GameFinished");
        const event = log.args;
        event.prizePool
          .toString()
          .should.equal(ether(3).toString(), " prize pool is correct");
        event.gameNumber.toString().should.equal("1", "game number is correct");
        event.winner
          .toString()
          .should.equal(player3, " player3 won is correct");
      });
      it('creates a new game with true', async () => {
        result = await lottery.selectWinner(ether(2.9), true);
        amount = ether(4);
        await lottery.joinGame({ from: player1, value: amount });
        let numGames = await lottery.numberOfGames();
        let g = await lottery.games(numGames);
        let u1 = await lottery.users(numGames, g.numberOfUsers);
        let c1 = await lottery.userContributions(numGames, u1);
        let n = await g.numberOfUsers;
        let p = await g.prizePool;
        numGames.toString().should.eq("2", "number of games is correct")
        n.toString().should.eq("1", "number of users in game is correct");
        u1.should.eq(player1, "first player in game is correct");
        c1.toString().should.eq(amount.toString(), "contribution is correct");
        p.toString().should.eq(amount.toString(), "Prizepool is correct")
      })

      it('creates a new game with false', async () => {
        result = await lottery.selectWinner(ether(2.9), false);
        await lottery.startGame({ from: deployer });
        amount = ether(4);
        await lottery.joinGame({ from: player1, value: amount });
        let numGames = await lottery.numberOfGames();
        let g = await lottery.games(numGames);
        let u1 = await lottery.users(numGames, g.numberOfUsers);
        let c1 = await lottery.userContributions(numGames, u1);
        let n = await g.numberOfUsers;
        let p = await g.prizePool;
        numGames.toString().should.eq("2", "number of games is correct")
        n.toString().should.eq("1", "number of users in game is correct");
        u1.should.eq(player1, "first player in game is correct");
        c1.toString().should.eq(amount.toString(), "contribution is correct");
        p.toString().should.eq(amount.toString(), "Prizepool is correct")
      })
    })
  );
});
