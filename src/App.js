import React, { Component } from 'react'
import logo from './logo.svg';
import './App.css';

import Web3 from 'web3';
import Navbar from './components/Navbar';
import Marketplace from './abis/Marketplace.json';

import Market from './components/Market'


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accounts: [],
      account: '',
      productCount: 0,
      products: [],
      loading: true,
    }
    this.createProduct = this.createProduct.bind(this)
  }


  async componentWillMount() {
    window.addEventListener('load', async () => {
      await this.loadWeb3();
      await this.loadBlockchainData()
    })

  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable()
      } catch (error) {
        console.error('Conn Error::', error);
      }

    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }


  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    console.log('Accounts::', accounts);
    this.setState({ account: accounts[0] });
    const networkId = await web3.eth.net.getId();

    console.log('Network Id::', networkId)
    const networkData = Marketplace.networks[5777]
    console.log('Network data::', networkData)

    if (networkData) {
      const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address);
      console.log('Marketplace::', marketplace);
      this.setState({ marketplace });
      // const productCount = await marketplace.methods.productCount().call();
      // console.log('Product Count::', productCount)
      this.setState({ loading: false })

    } else {
      window.alert('Marketplace contract not deployed to detected network.')
    }
  }


  createProduct(name, price) {
    this.setState({ loading: true });
    this.state.marketplace.methods.createProduct(name, price).send({ from: this.state.account }).once('receipt', (receipt) => {
      this.setState({ loading: false });
    })
  }


  render() {
    return (
      <div className="App">
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading ? <div id="loader" className="text-center">
                <p className="text-center">Loading...</p>
              </div> : <Market createProduct={this.createProduct} />}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
