import { useEffect, useState, useCallback } from "react";
import "./App.css";
import Web3 from "web3";
import detectEthereumProvider from '@metamask/detect-provider';
import { loadContract } from "./utils/load-contract";

function App() {

  // Set state variables using useState
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null
  })

  const [contractBalance, setContractBalance] = useState(null)
  const [account, setAccount] = useState(null)
  const [shouldReload, setShouldReload] = useState(false)

  const canConnectToContract = account && web3Api.contract
  
  const reloadEffect = useCallback(() => {
    setShouldReload(!shouldReload)
  }, [shouldReload])

  const setAccountListener = (provider) => {
    // Set account to new account when user changes account
    provider.on("accountsChanged", () => window.location.reload())
    provider.on("chainChanged", () => window.location.reload())
  
    // OPTIONAL Set account to null when user logs out
    //
    // provider._jsonRpcConnection.events.on("notification", (payload) => {
    //   const { method } = payload

    //   if (method ===  "metamask_unlockStateChanged") {
    //     setAccount(null)
    //   }
    // })
  }

  // load provider and set web3api and listen to changes in account
  useEffect(() => {
    const loadProvider = async () => {
      // provider from metamask API
      const provider = await detectEthereumProvider()

      // set provider
      if (provider) {
        // contract that you wish to load
        const contract = await loadContract("Faucet", provider)
        setAccountListener(provider)
        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract,
          isProviderLoaded: true
        })
      } else {
        // setWeb3Api({...web3Api, isProviderLoaded: true})
        setWeb3Api(api => ({...api, isProviderLoaded: true}))
        console.error("Please install Metamask.");
      }
    }

    loadProvider()
  }, []);

  // Gets the balance in the contract
  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api
      const balance = await web3.eth.getBalance(contract.address)
      setContractBalance(web3.utils.fromWei(balance, "ether"))
    }

    web3Api.contract && loadBalance()
  }, [web3Api, shouldReload])

  // Get account being used
  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts()
      // Get active account and set state variable
      setAccount(accounts[0])
    }

    // the web3 clause checks if we have web3 initialised
    web3Api.web3 && getAccount()
  }, [web3Api.web3])
  // the dependency array above means that, the effect is called 
  // ONLY when that thing is updated

  // Add funds to faucet!
  const addFunds = useCallback(async () => {
    const { contract, web3 } = web3Api
    await contract.addFunds({
      from: account,
      value: web3.utils.toWei("1", "ether")
    })

    reloadEffect()
  }, [web3Api, account, reloadEffect])

  // Withdraw funds from faucet!
  const withdraw = useCallback(async () => {
    const { contract, web3 } = web3Api
    const withdrawAmount = web3.utils.toWei("0.1", "ether")
    await contract.withdraw(withdrawAmount, {
      from: account
    })

    reloadEffect()
  }, [web3Api, account, reloadEffect])

  return (
    <>
      <div className="faucet-wrapper">
        <div className="faucet">
          { web3Api.isProviderLoaded
            ?
            <div className="is-flex is-align-items-center">
              <span>
                <strong className="mr-2">Account: </strong>
              </span>
              { account
                ? <div>{account}</div>
                : !web3Api.provider
                ?
                <>
                  <div className="notification is-warning is-size-6 is-rounded">
                    Wallet is not detected!{` `}
                    <a target="_blank" rel="noreferrer" href="https://docs.metamask.io">
                      Install Metamask
                    </a>
                  </div>
                </>
                :
                <button
                  className="button is-small"
                  onClick={() => 
                    web3Api.provider.request({method: "eth_requestAccounts"}
                  )}
                >
                  Connect to Metamask
                </button>
              }
            </div>
            :
            <span>Looking for Web3...</span>
          }
          <div className="balance-view is-size-2 mb-4 mt-1">
            Current Balance: <strong>{contractBalance}</strong> ETH
          </div>
          {
            !canConnectToContract &&
            <i className="is-block mb-3">
              *Sign in to your wallet and connect to Ganache network
            </i>
          }
          <button
            disabled={!canConnectToContract}
            onClick={addFunds} 
            className="button is-link mr-2">
              Donate 1 ETH
            </button>
          <button
            disabled={!canConnectToContract}
            onClick={withdraw}
            className="button is-primary">
              Withdraw 0.1 ETH
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
