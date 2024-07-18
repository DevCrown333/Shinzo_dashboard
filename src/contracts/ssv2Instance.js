import Web3 from 'web3'
import abi from './abi'
import * as Web3Utils from 'web3-utils';
import getContractsAddress from './contractsAddress';

const provider = () => {
    // 1. Try getting newest provider
    const { ethereum } = window
    if (ethereum) return ethereum

    // 2. Try getting legacy provider
    const { web3 } = window
    if (web3 && web3.currentProvider) return web3.currentProvider
}

let contractInstance

if (provider()) {
    const web3 = new Web3(provider())
    contractInstance = web3.eth.net.getId().then(id => {
        const address = getContractsAddress(id)
        const contractInstance = new web3.eth.Contract(abi, address)
        return {
            async balanceOf(sender) {
                const amount = await contractInstance.methods.balanceOf(sender).call()
                return Web3Utils.fromWei(amount, 'ether');
            },
            async calculateClaimRewards(address) {
                const balance = await contractInstance.methods.calculateClaimRewards(address).call()
                return balance[1];
            },
            async bnbRewardClaimedAsBUSD(address) {
                const balance = await contractInstance.methods.bnbRewardClaimedAsBUSD(address).call();
                return balance;
            },
            async totalBNBClaimedAsBUSD() {
                const balance = await contractInstance.methods.totalBNBClaimedAsBUSD().call();
                return Web3Utils.fromWei(balance, 'ether');
            },
            async claimReward(sender) {
                try {
                    await contractInstance.methods.claimReward().send({
                        'from': sender
                    })
                } catch (e) {
                    console.log(e);
                }
            }
        }
    })
}

export default contractInstance
