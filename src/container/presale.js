import React, { useEffect, useState } from 'react';
import { getWeb3 } from '../web3/getWeb3'
// Import button component
import contractInstance from '../contracts/ssv2Instance';
import { Background } from './background';

import Web3 from "web3";
import { toWei, fromWei } from "web3-utils";

// Simple counter using React Hooks
export const Presale = () => {
    const [walletAddress, setWalletAddress] = useState("");
    const [shinzoBalance, setShinzoBalance] = useState("");
    const [shinzoBalanceInBNB, setShinzoBalanceInBNB] = useState("");
    const [busdBalance, setBusdBalance] = useState("");
    const [earned, setEarned] = useState("0")
    const [notClaimed, setNotClaimed] = useState("0")
    const [busdValue, setBusdValue] = useState("0")
    const [shinzoValue, setShinzoValue] = useState(0)
    const [totalReward, setTotalReward] = useState("0");
    const [bnbPrice, setBnbPrice] = useState(0);
    const pancakeSwapRouter = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
    const shinzoAddress = "0xC9Ad2F68059dFeB39DBb00A867ebB1f9b782f353";
    const WETHAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
    const BusdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
    const abi = [
        {
            name: "getAmountsOut",
            type: "function",
            inputs: [
                {
                    name: "amountIn",
                    type: "uint256",
                },
                { name: "path", type: "address[]" },
            ],
            outputs: [{ name: "amounts", type: "uint256[]" }],
        },
    ];

    const BogToolAbi = [
        {
            inputs: [],
            name: "getBNBSpotPrice",
            outputs: [
                {
                    internalType: "uint256",
                    name: "",
                    type: "uint256"
                }
            ],
            stateMutability: "view",
            type: "function"
        },
    ];

    const busdAbi = [
        {
            constant: true,
            inputs: [
                {
                    internalType: "address",
                    name: "account",
                    type: "address"
                }
            ],
            name: "balanceOf",
            outputs: [
                {
                    internalType: "uint256",
                    name: "",
                    type: "uint256"
                }
            ],
            payable: false,
            stateMutability: "view",
            type: "function"
        },
    ]

    async function getBnbSpotPrice() {
        const web3 = await getWeb3();
        const BogToolRouter = new web3.eth.Contract(
            BogToolAbi,
            "0x40Db1b9bB3aA8a9961be036b642021CA8f38Dd0a"
        );
        let bigBnbSpotPrice = 0
        try {
            bigBnbSpotPrice = await BogToolRouter.methods.getBNBSpotPrice().call();
        } catch (error) {
            console.log(error)
        }
        return bigBnbSpotPrice
    }


    async function loadBlockchainData() {
        try {
            const web3 = await getWeb3();

            const provider = window.ethereum;
            if (!provider) {
                alert("Metamask is not installed, please install!");
            }

            const chainId = await provider.request({ method: 'eth_chainId' });
            const binanceTestChainId = '0x38'
            if (chainId === binanceTestChainId) {
                console.log("Bravo!, you are on the correct network");
            } else {
                try {
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x38' }],
                    });
                    console.log("You have succefully switched to Binance Test network")
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        try {
                            await provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: '0x38',
                                        chainName: 'Binance Smart Chain',
                                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                                        blockExplorerUrls: ['https://bscscan.com/'],
                                        nativeCurrency: {
                                            symbol: 'BNB',
                                            decimals: 18,
                                        }
                                    }
                                ]
                            });
                        } catch (addError) {
                            console.log(addError);
                            // alert(addError);
                        }
                    }
                    // alert("Failed to switch to the network")
                    return;
                }
            }
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            setWalletAddress(account);
            const contract = await contractInstance;
            try {
                const tokenBalance = await contract.balanceOf(account);
                setShinzoBalance(tokenBalance);
                const busdContract = new web3.eth.Contract(
                    busdAbi,
                    BusdAddress
                );
                const balanceofBusd = await busdContract.methods.balanceOf(account).call();
                setBusdBalance(balanceofBusd / 10 ** 18);
                const notClaimedAmount = await contract.calculateClaimRewards(account);
                const earnedAmount = await contract.bnbRewardClaimedAsBUSD(account);
                const totalRewardAmount = await contract.totalBNBClaimedAsBUSD();
                setTotalReward(totalRewardAmount);

                const BNBPrice = await getBnbSpotPrice();
                setBnbPrice(BNBPrice / 10 ** 10);
                const dexRouter = new web3.eth.Contract(
                    abi,
                    pancakeSwapRouter
                );
                const tokenPricePair = await dexRouter.methods.getAmountsOut(toWei("1"), [WETHAddress, shinzoAddress]).call();
                console.log(tokenPricePair[1]);
                const price = 10 ** 18 / parseInt(tokenPricePair[1]);
                setShinzoValue(price * BNBPrice / 10 ** 10);

                const busdPricePair = await dexRouter.methods.getAmountsOut(toWei("1"), [WETHAddress, BusdAddress]).call();
                console.log(busdPricePair[1]);
                const busdPrice = 10 ** 18 / parseInt(busdPricePair[1]);
                setBusdValue(busdPrice * BNBPrice / 10 ** 10);

                const shinzoworth = await dexRouter.methods.getAmountsOut(toWei(tokenBalance), [shinzoAddress, WETHAddress]).call();
                setShinzoBalanceInBNB(shinzoworth[1] / 10 ** 18);

                const earnedInBusd = await dexRouter.methods.getAmountsOut(earnedAmount, [WETHAddress, BusdAddress]).call();
                const notClaimedInBusd = await dexRouter.methods.getAmountsOut(notClaimedAmount, [WETHAddress, BusdAddress]).call();
                setEarned(earnedInBusd[1] / 10 ** 18);
                setNotClaimed(notClaimedInBusd[1] / 10 ** 18);
            } catch (e) {
                console.log(e);
            }

        } catch (error) {

        }
    }

    useEffect(() => {
        loadBlockchainData();
    }, []);

    window.addEventListener("load", function () {
        if (window.ethereum) {

            // detect Metamask account change
            window.ethereum.on('accountsChanged', function (accounts) {
                console.log('accountsChanges', accounts);
                setWalletAddress("");
            });

            // detect Network account change
            window.ethereum.on('networkChanged', function (networkId) {
                setWalletAddress("");
            });
        } else {
            console.warn(
                "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
            );
        }
    });

    const connect = async () => {
        loadBlockchainData();
    }

    const claimRewards = async () => {
        if (walletAddress.length) {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            const contract = await contractInstance;
            try {
                await contract.claimReward(account);
            } catch (e) {
                console.log(e);
            }
        }
    }

    return (
        <>
            <Background />

            <nav className="v-navigation-drawer v-navigation-drawer--fixed v-navigation-drawer--mini-variant v-navigation-drawer--custom-mini-variant v-navigation-drawer--open theme--dark d-none d-sm-flex"
                elevation="5"
                style={{
                    height: '100vh', top: '0px', maxHeight: 'calc(100% - 0px)',
                    transform: 'translateX(0 %)',
                    width: '90px'
                }}
                data-booted="true">
                <div className="v-navigation-drawer__content">
                    <div tabIndex="-1" height="" className="mt-2 mb-2 d-none d-sm-flex v-list-item theme--dark">
                        <div height="60" className="v-list-item__title title"></div><button type="button"
                            className="v-btn v-btn--icon v-btn--round theme--dark v-size--default"><span
                                className="v-btn__content"><i aria-hidden="true"
                                    className="v-icon notranslate mdi mdi-chevron-left theme--dark"></i></span></button>
                    </div>
                    <div className="v-list v-sheet theme--dark v-list--nav">
                        <div role="listbox" className="border-top v-item-group theme--dark v-list-item-group"><a
                            href="/" aria-current="page"
                            className="v-item--active v-list-item--active v-list-item v-list-item--link theme--dark"
                            tabIndex="0">
                            <div title="Earnings" className="v-list-item__icon"><img src="public/img/Wallet_Icon.d00b11b2.png" />
                            </div>
                            <div className="v-list-item__content">
                                <div className="v-list-item__title">Earnings</div>
                            </div>
                        </a><a tabIndex="0"
                            href="https://pancakeswap.finance/swap?outputCurrency=0xC9Ad2F68059dFeB39DBb00A867ebB1f9b782f353"
                            target="_blank" className="v-list-item v-list-item--link theme--dark">
                                <div title="Swap Tokens" className="v-list-item__icon"><img src="public/img/Arrow_Icon.ba246326.png" />
                                </div>
                                <div className="v-list-item__content">
                                    <div className="v-list-item__title">Swap Tokens</div>
                                </div>
                            </a></div>
                    </div>
                    <div className="v-list v-sheet theme--dark v-list--nav">
                        <div role="listbox" className="v-item-group theme--dark v-list-item-group"><a tabIndex="0"
                            href="https://shinzotoken.com/" target="_blank"
                            className="v-list-item v-list-item--link theme--dark">
                            <div title="Website" className="v-list-item__icon"><img src="public/img/World_Icon.b78edbd4.png" />
                            </div>
                            <div className="v-list-item__content">
                                <div className="v-list-item__title">Website</div>
                            </div>
                        </a></div>
                    </div>
                    <div className="v-list v-sheet theme--dark v-list--nav">
                        <a href='#footer'>
                            <div className="v-list-group">
                                <div title="Communities" tabIndex="0" aria-expanded="false" role="button"
                                    className="v-list-group__header v-list-item v-list-item--link theme--dark">
                                    <div className="v-list-item__icon"><img src="public/img/User_Icon.fcffcad4.png" /></div>
                                    <div className="v-list-item__content">
                                        <div className="v-list-item__title">Communities</div>

                                    </div>
                                    <div className="v-list-item__icon v-list-group__header__append-icon"><i aria-hidden="true"
                                        className="v-icon notranslate mdi mdi-chevron-down theme--dark"></i></div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
                <div className="v-navigation-drawer__border"></div>
            </nav>


            <div className="container">
                <div className='d-flex mt-4 items-center'>
                    <a href="https://shinzotoken.com/" className='mt-4 mb-4'> <img className="slider-img" src="public/img/shinzo.png"></img></a>
                    <div className='h-50'>
                        <button type="button"
                            className="pa-1 v-btn v-btn--is-elevated v-btn--has-bg theme--dark v-size--default blue darken-4"><span
                                className="v-btn__content" onClick={() => connect()}>{walletAddress.length ? 'Wallet Connected' : 'Wallet Connect'}</span></button>
                    </div>
                </div>
            </div>
            <div align="center" className="original-announcement">
                <div className="wrtext">(Please make sure you are visiting https://shinzotoken.com/)</div>
            </div>
            <main className="v-main blue-white lighten-5" style={{ padding: '56px 0px 0px 90px' }} data-booted="true">
                <div className="v-main__wrap">
                    <div className="blue-white--text text--darken-4">
                        <div className="main-content">
                            <div className="inner-content">
                                <div className="container">
                                    <div className="row">
                                        <div sm="12">
                                            <div>
                                                <div className="egccol v-card v-sheet theme--dark  darken-4 pa-1">
                                                    <div align="center" className="d-sm-none">
                                                        <div className="font-weight-light wrtext">(On 📱SmartPhone! Use Dapps
                                                            Browser like Metamask and Trustwallet and Select "Binance Smart
                                                            Chain" Network on Wallet to see Your Rewards.)</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-4">
                                                <div className="egccol v-card v-sheet theme--dark  darken-4 pa-1">
                                                    <div align="center">
                                                        <div className="font-weight-light wrtext">
                                                            <div className="v-input shrink v-input--hide-details theme--light v-text-field v-text-field--single-line v-text-field--solo v-text-field--is-booted v-text-field--enclosed v-text-field--outlined v-text-field--placeholder"
                                                                style={{ width: '100vh' }}>
                                                                <div className="v-input__control">
                                                                    <div className="v-input__slot input-yellow">
                                                                        <fieldset aria-hidden="true">
                                                                            <legend><span className="notranslate">​</span>
                                                                            </legend>
                                                                        </fieldset>
                                                                        <div className="v-text-field__slot input-yellow">
                                                                            <input id="input-38"
                                                                                placeholder="Wallet Address" type="text" className='conditional-heading text-center ' value={walletAddress} readOnly />
                                                                        </div>
                                                                        <div className="v-input__append-inner">
                                                                            <div></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-4 wallet-section">
                                                <div className="egccol mb-5 v-card v-sheet theme--dark darken-4 pa-5">
                                                    <div className="row">
                                                        <div className="left-wallet col-sm-6 col-md-6 col-12">
                                                            <div align="center">
                                                                <h2 className='font-weight-light'>Your Wallet</h2>
                                                                <div align="center" className="mt-3"><span
                                                                    className="h2 font-weight-bold lh0">{parseFloat(shinzoBalance).toFixed(4)}</span> <img
                                                                        src="public/img/EGC_Logo.db55568d.png" width="30"
                                                                        className="ml-1" /></div>
                                                                <div align="center"><h5 className='font-weight-light'>($ {(shinzoBalanceInBNB * bnbPrice).toFixed(4)})</h5></div>
                                                                <div align="center" className="mt-3"><span
                                                                    className="h2 font-weight-bold lh0">{parseFloat(busdBalance).toFixed(4)}</span> <img
                                                                        src="public/img/busd_32.png"
                                                                        width="30" className="ml-1" /></div>
                                                                <div align="center"><span
                                                                    className="h5 font-weight-light">(${(busdBalance * busdValue).toFixed(4)})</span></div>
                                                                <hr role="separator" aria-orientation="horizontal"
                                                                    className="pa-2 v-divider theme--dark" />
                                                                <div className="h2 font-weight-light">Total Earned:</div>
                                                                <div align="center" className="mt-3"><span
                                                                    className="h2 font-weight-bold lh0">{parseFloat(earned).toFixed(4)}</span> <img
                                                                        src="public/img/busd_32.png"
                                                                        width="30" className="ml-1" /></div>
                                                                <div align="center"><span
                                                                    className="h5 font-weight-light">(${(earned * busdValue).toFixed(4)})</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="right-wallet col-sm-6 col-md-6 col-12">
                                                            <hr role="separator" aria-orientation="horizontal"
                                                                className="d-sm-none pa-2 v-divider theme--dark" />
                                                            <div align="center">
                                                                <div className="h2 font-weight-light">Rewards Not Claimed
                                                                </div>
                                                                <div align="center" className="mt-5"><span
                                                                    className="h2 font-weight-bold lh0">{parseFloat(notClaimed).toFixed(4)}</span> <img
                                                                        src="public/img/busd_32.png"
                                                                        width="30" className="ml-1" /></div>
                                                                <div align="center"><span
                                                                    className="h5 font-weight-light">(${(notClaimed * busdValue).toFixed(4)})</span></div>
                                                                <button type="button"
                                                                    className="manual-claim-btn v-btn v-btn--is-elevated v-btn--has-bg theme--dark v-size--default" onClick={() => claimRewards()}><span
                                                                        className="v-btn__content">Claim
                                                                        Manually</span></button>
                                                            </div>
                                                            <div align="center" className="mt-2">
                                                                <p> Rewards are automatically sent every 60 minutes. It can,
                                                                    however, take longer depending on your holdings and
                                                                    trading volume. Rewards will be triggered once they are
                                                                    big enough to cover the gas fees. If you are a smaller
                                                                    holder it may take from a couple hours to a few days for
                                                                    rewards to appear in your wallet. You can also manually
                                                                    claim unclaimed rewards, but you will need to pay the
                                                                    gas fees.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="reward-section">
                                    <div className="reward-title">
                                        <div className="container">
                                            <div className="row">
                                                <div className="col-sm-12 text-center">
                                                    <h2>Rewards Distributed To Holders</h2>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="container egccol v-card v-sheet theme--dark darken-4 pa-5">
                                        <div className="row">
                                            <div className="col-sm-2">&nbsp;</div>
                                            <div className="col-sm-8">
                                                <div className="detail-section">
                                                    <div className="details-total"><span
                                                        className="text-h4 font-weight-light"></span><span
                                                            className="h2 font-weight-light">(${(totalReward * bnbPrice).toFixed(4)})</span></div>
                                                    <div className="busd-coin-img"><img src="public/img/BUSD_Coin.373c1fab.png" /></div>
                                                </div>
                                                <div className="contract-details">
                                                    <div className="contract-img"><img src="public/img/Contract_icon.61537da5.png" />
                                                    </div>
                                                    <div className="contact-link">
                                                        <div className="contract-head text-h5 font-weight-bold">Shinzo Contract:
                                                        </div>
                                                        <div className="contract-link"><span
                                                            className="h4 font-weight-light">0xC9Ad2F68059dFeB39DBb00A867ebB1f9b782f353</span>&nbsp;
                                                            <button
                                                                type="button"
                                                                className="h4 v-btn v-btn--icon" onClick={() => { navigator.clipboard.writeText("0xC9Ad2F68059dFeB39DBb00A867ebB1f9b782f353") }}>
                                                                <i className="fas fa-copy"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="contract-details">
                                                    <div className="contract-img"><img src="public/img/Contract_icon.61537da5.png" />
                                                    </div>
                                                    <div className="contact-link">
                                                        <div className="contract-head text-h5 font-weight-bold">BUSD Contract:
                                                        </div>
                                                        <div className="contract-link"><span
                                                            className="h4 font-weight-light">0xe9e7cea3dedca5984780bafc599bd69add087d56</span>&nbsp;
                                                            <button
                                                                type="button"
                                                                className="h4 v-btn v-btn--icon" onClick={() => { navigator.clipboard.writeText("0xe9e7cea3dedca5984780bafc599bd69add087d56") }}>
                                                                <i className="fas fa-copy"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-sm-2">&nbsp;</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='container' id="footer">
                    <div className='border border-warning border-top-0 border-left-0 border-right-0 border-bottom-0' >
                        <section id="bigblocks">
                            <div className='container'>
                                <div className="row d-grid mt-4 justify-content-center" id="bigblocks-container">
                                    <div className='col-1 d-flex flex-column mb-2'>

                                    </div>
                                    <div className='d-flex flex-column align-items-center mb-2 mr-3'>
                                        <div className='w-100'>
                                            <img className="small-img" src="public/img/shinzo.png"></img>
                                        </div>
                                    </div>
                                    <div className='d-flex flex-column mb-2'>
                                        <div className='thin-border border-primary border-top-0 border-right-0 border-left-0'>
                                            <h5 className='text-white text-center font-weight-bold'>Coming Soon</h5>
                                        </div>
                                        <br />
                                        <ul className='list-ul small-line'>
                                            <li><p className='text-white font-weight-normal'>CoinMarketCap</p></li>
                                            <li><p className='text-white font-weight-normal'>CoinGecko</p></li>
                                        </ul>

                                    </div>
                                    <div className='d-flex flex-column mb-2'>
                                        <div className='thin-border border-primary border-top-0 border-right-0 border-left-0'>
                                            <h5 className='text-uppercase text-white text-center font-weight-bold'>join our community</h5>
                                        </div>
                                        <br />

                                        <div className="d-flex justify-content-end pr-5">
                                            <div>
                                                <span className='block bg-twitter pl-2 pr-2 pt-1 pb-1'>
                                                    <a href="https://twitter.com/ShinzoToken" target="_blank">
                                                        <i className="fab fa-twitter text-white"></i>
                                                    </a>
                                                </span>
                                            </div>
                                            &nbsp;
                                            <div>
                                                <span className='block bg-facebook pl-2 pr-2 pt-1 pb-1'>
                                                    <a href="https://www.facebook.com/ShinzoToken-101527725764349" target="_blank">
                                                        <i className="fab fa-facebook text-white"></i></a>
                                                </span>
                                            </div>
                                            &nbsp;
                                            <div>
                                                <span className='block bg-twitter pl-2 pr-2 pt-1 pb-1'>
                                                    <a href="https://t.me/shinzotokengroup" target="_blank">
                                                        <i className="fab fa-telegram text-white"></i></a>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='d-flex flex-column mb-2'>
                                        <div className='thin-border border-primary border-top-0 border-right-0 border-left-0'>
                                            <h5 className='text-white font-weight-bold'>Disclaimer</h5>
                                        </div>
                                        <br />
                                        <p className='text-white font-weight-normal small-text'>
                                            Copyright © 2022. All rights reserved.</p>

                                    </div>
                                </div>
                            </div>
                        </section>
                    </div >
                </div>
            </main>
        </>
    );
};