const Lottery = artifacts.require('./Lottery');

require('chai').use(require('chai-as-promised')).should()

contract('Lottery', ([deployer, player1, player2]) => {
    let Lottery

    beforeEach(async () => {
        lottery = await Lottery.new(deployer)
    })

    describe('deployment', () => {
        it('tracks the creator', async () => {
            const result = await lottery.creator()
            result.should.equal(deployer)
        })
    })

    describe('creating game', async () => {
        await lottery.startGame();
        it('doesnt allow a new game to be created once one is going', async () => {
            await lottery.startGame().should.be.rejectedWith('Previous game isnt finished')
        })
    })

    describe('joining game', async () => {
        
    })
})