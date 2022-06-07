/* eslint-disable react/jsx-no-target-blank */
require('dotenv').config();

const contractABI = require("../contract-abi.json");

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY;

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const web3 = createAlchemyWeb3(alchemyKey);

export const helloWorldContract = new web3.eth.Contract(
    contractABI,
    contractAddress
);

export const loadCurrentMessage = async () => {
    const message = await helloWorldContract.methods.message().call();

    return message
};

const assetWalletInstalled = () => {
    return new Promise((resolve, reject) => {
        if (window.ethereum) {
            resolve(true)
        } else {
            reject({
                address: '',
                status: `You must install a wallet (Coinbase/Metamask) in your browser`
            })
        }
    })
}

export const listenAccountChanges = async (onChangleHandler = () => { }) => {
    try {
        await assetWalletInstalled()
        window.ethereum.on("accountsChanged", (accounts) => {
            if (accounts.length > 0) {
                onChangleHandler({
                    walletAddress: accounts[0],
                    status: "👆 Write a message in the text-field above."
                })
            } else {
                onChangleHandler({
                    walletAddress: '',
                    status: "👆 Connect to Coinbase/Metamask using the top right button."
                })
            }
        })
    } catch (error) {
        return onChangleHandler({
            address: '',
            error: true,
            status: `😢 ${error.status}`
        })
    }
}

export const connectWallet = async () => {
    try {
        await assetWalletInstalled()
        const addressArray = await window.ethereum.request({
            method: 'eth_requestAccounts'
        })

        return {
            status: '👆 Write a message in the text-field above.',
            address: addressArray[0]
        }
    } catch (error) {
        return {
            address: '',
            status: `😢 ${error.status}`
        }
    }
};

export const getCurrentWalletConnected = async () => {
    try {
        await assetWalletInstalled()
        const addressArray = await window.ethereum.request({
            method: "eth_accounts",
        });

        if (addressArray.length > 0) {
            return {
                address: addressArray[0],
                status: "👆🏽 Write a message in the text-field above.",
            };
        } else {
            return {
                address: "",
                status: "Connect to Coinbase/Metamask using the top right button.",
            };
        }
    } catch (err) {
        return {
            address: "",
            status: `😥 ${err.message}`
        };
    }
};

export const updateMessage = async (address, message) => {
    try {
        await assetWalletInstalled()

        if (message?.trim() === '') return {
            status: "❌ Your message cannot be a falsy value.",
        };

        const transactionParameters = {
            to: contractAddress,
            from: address,
            data: helloWorldContract.methods.update(message).encodeABI(),
        };

        const txHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [transactionParameters],
        });

        return {
            status: (
                <span>
                    ✅{" "}
                    <a target="_blank" href={`https://goerli.etherscan.io/tx/${txHash}`}>
                        View the status of your transaction on Etherscan!
                    </a>
                    <br />
                    ℹ️ Once the transaction is verified by the network, the message will
                    be updated automatically.
                </span>
            ),
        };
    } catch (error) {
        return {
            status: "😥 " + error.message,
        };
    }
};
