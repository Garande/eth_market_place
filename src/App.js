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
      marketplace: null,
      accounts: [],
      account: '',
      productCount: 0,
      products: [],
      loading: true,
    }
    this.createProduct = this.createProduct.bind(this);
    this.retrieveProducts = this.retrieveProducts.bind(this);
    this.retrieveProductById = this.retrieveProductById.bind(this);
    this.purchaseProduct = this.purchaseProduct.bind(this)
  }


  async componentWillMount() {
    window.addEventListener('load', async () => {
      await this.loadWeb3();
      await this.loadBlockchainData()
    })

  }

  async loadWeb3() {
    if (window.ethereum) {
      //?Un comment when deploying to production
      // window.web3 = new Web3(window.ethereum);
      /** For Development Purposes only */
      //?!Remove when deploying to production
      window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
      try {

        await window.ethereum.enable()
        console.log('ETHERKLKDJLKDJDLKJDLKJ')
      } catch (error) {
        console.error('Conn Error::', error);
      }

    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
      /*** For Development Purposes only  */
      //?!Remove when deploying to production
      window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
    }


  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    console.log('Accounts::', accounts);
    this.setState({ account: accounts[0] });
    const networkId = await web3.eth.net.getId();

    console.log('Network Id::', networkId)
    const networkData = Marketplace.networks[networkId]
    console.log('Network data::', networkData)

    if (networkData) {
      const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address);
      console.log('Marketplace::', marketplace);
      this.setState({ marketplace });
      const productCount = await marketplace.methods.productCount().call();
      console.log('Product Count::', productCount)
      this.setState({ productCount, loading: false })
      // this.setState({  });
      this.retrieveProducts();

    } else {
      window.alert('Marketplace contract not deployed to detected network.')
    }
  }

  async retrieveProducts() {
    for (let x = 0; x <= this.state.productCount; x++) {
      let product = await this.state.marketplace.methods.products(x).call();
      this.setState({ products: [...this.state.products, product] });
    }
  }


  async createProduct(name, price) {
    // this.setState({ loading: true });
    // gas: 100000
    let balance = await window.web3.eth.getBalance(this.state.account);
    console.log('Account Balance:::', window.web3.utils.fromWei(balance.toString(), 'Ether'))
    this.state.marketplace.methods.createProduct(name, price).send({ from: this.state.account, gas: 3000000 }).once('receipt', (receipt) => {
      // this.setState({ loading: false, products: [...this.state.products, receipt] });
      console.log("REDATA::", receipt)
      // this.setState({ loading: false })
      let productId = receipt.events.ProductCreated.returnValues.id
      console.log('RECEIPT:::', productId)
      this.retrieveProductById(productId);
    })
  }

  async retrieveProductById(productId) {
    let product = await this.state.marketplace.methods.products(productId).call();
    let data = this.state.products;
    let index = data.findIndex((pt) => pt.id === productId);
    if (index > 0) {
      data.splice(index, 1, product)
      this.setState({ loading: false, products: data });
    } else
      this.setState({ products: [...this.state.products, product] });
  }


  async purchaseProduct(productId, price) {
    // this.setState({ loading: true });
    try {


      console.log("PRODUCTID:::", productId);
      console.log("PRICE:::", price)


      let result = await this.state.marketplace.methods.purchaseProduct(productId).send({ from: this.state.account, gas: 3000000, value: price });

      console.log('Result:::', result)

      let event = result.logs[0].args;
      if (event.purchased) {
        // result.logs[0].args
        this.retrieveProductById(productId)
      }

    } catch (error) {
      console.log('ERROR::::', error)
    }
    // .once('receipt', (receipt) => {
    //   console.log('RECEIPT:::', receipt)
    //   // ProductPurchased
    //   this.retrieveProductById(productId)
    //   // let data = this.state.products;
    //   // let index = data.findIndex((pt) => pt.id === receipt.id);
    //   // data.splice(index, 1, receipt)
    //   // this.setState({ loading: false, products: data });

    // })
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
              </div> : <Market createProduct={this.createProduct} products={this.state.products} purchaseProduct={this.purchaseProduct} />}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
