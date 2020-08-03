const Lottery = artifacts.require("Lottery");

module.exports = async function(deployer) {
  const accounts = await web3.eth.getAccounts()

  const acc = accounts[0]

  await deployer.deploy(Lottery, acc)
};
