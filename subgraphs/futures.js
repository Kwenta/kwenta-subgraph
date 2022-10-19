const { getCurrentNetwork, getContractDeployments } = require('./utils/network');

const manifest = [];

// futures market manager
getContractDeployments('FuturesMarketManager').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `futures_FuturesMarketManager_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'FuturesMarketManager',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/futures.ts',
      entities: ['FuturesMarket'],
      abis: [
        {
          name: 'FuturesMarket',
          file: '../abis/FuturesMarket.json',
        },
        {
          name: 'FuturesMarketManager',
          file: '../abis/FuturesMarketManager.json',
        },
      ],
      eventHandlers: [
        {
          event: 'MarketAdded(address,indexed bytes32,indexed bytes32)',
          handler: 'handleMarketAdded',
        },
        {
          event: 'MarketRemoved(address,indexed bytes32,indexed bytes32)',
          handler: 'handleMarketRemoved',
        },
      ],
    },
  });
});

// futures markets
const futuresMarketTemplate = {
  kind: 'ethereum/contract',
  name: `FuturesMarket`,
  network: getCurrentNetwork(),
  source: {
    abi: 'FuturesMarket',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.5',
    language: 'wasm/assemblyscript',
    file: '../src/futures.ts',
    entities: ['FuturesMarket', 'FuturesPosition', 'FuturesTrade'],
    abis: [
      {
        name: 'FuturesMarket',
        file: '../abis/FuturesMarket.json',
      },
    ],
    eventHandlers: [
      {
        event: 'MarginTransferred(indexed address,int256)',
        handler: 'handleMarginTransferred',
      },
      {
        event: 'PositionModified(indexed uint256,indexed address,uint256,int256,int256,uint256,uint256,uint256)',
        handler: 'handlePositionModified',
      },
      {
        event: 'PositionLiquidated(indexed uint256,indexed address,indexed address,int256,uint256,uint256)',
        handler: 'handlePositionLiquidated',
      },
      {
        event: 'FundingRecomputed(int256,uint256,uint256)',
        handler: 'handleFundingRecomputed',
      },
      {
        event: 'NextPriceOrderSubmitted(indexed address,int256,uint256,uint256,uint256,bytes32)',
        handler: 'handleNextPriceOrderSubmitted',
      },
      {
        event: 'NextPriceOrderRemoved(indexed address,uint256,int256,uint256,uint256,uint256,bytes32)',
        handler: 'handleNextPriceOrderRemoved',
      },
    ],
  },
};

// crossmargin
// addresses
OP_GOERLI_CROSSMARGIN_ADDRESS = '0xf6Be6F3b4DDC804978169F5B96A6D6dDA9212168';
OP_MAINNET_CROSSMARGIN_ADDRESS = '0x1fcFf1c7911dc209bdFc1648E5cDdB320f08AC08';

START_BLOCK_OP_GOERLI = 1272039;
START_BLOCK_OP_MAINNET = 30134307;

// set up
const crossMarginAddress =
  getCurrentNetwork() === 'optimism'
    ? OP_MAINNET_CROSSMARGIN_ADDRESS
    : getCurrentNetwork() === 'optimism-goerli'
    ? OP_GOERLI_CROSSMARGIN_ADDRESS
    : OP_GOERLI_CROSSMARGIN_ADDRESS;

const crossMarginStartBlock =
  getCurrentNetwork() === 'optimism'
    ? START_BLOCK_OP_MAINNET
    : getCurrentNetwork() === 'optimism-goerli'
    ? START_BLOCK_OP_GOERLI
    : 0;

manifest.push({
  kind: 'ethereum/contract',
  name: `crossmargin_factory`,
  network: getCurrentNetwork(),
  source: {
    address: crossMarginAddress,
    startBlock: crossMarginStartBlock,
    abi: 'MarginAccountFactory',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.5',
    language: 'wasm/assemblyscript',
    file: '../src/crossmargin.ts',
    entities: ['MarginAccountFactory'],
    abis: [
      {
        name: 'MarginAccountFactory',
        file: '../abis/MarginAccountFactory.json',
      },
    ],
    eventHandlers: [
      {
        event: 'NewAccount(indexed address,address)',
        handler: 'handleNewAccount',
      },
    ],
  },
});

const marginBaseTemplate = {
  kind: 'ethereum/contract',
  name: `MarginBase`,
  network: getCurrentNetwork(),
  source: {
    abi: 'MarginBase',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.5',
    language: 'wasm/assemblyscript',
    file: '../src/crossmargin.ts',
    entities: ['MarginBase'],
    abis: [
      {
        name: 'MarginBase',
        file: '../abis/MarginBase.json',
      },
    ],
    eventHandlers: [
      {
        event: 'OrderPlaced(indexed address,uint256,bytes32,int256,int256,uint256,uint8)',
        handler: 'handleOrderPlaced',
      },
      {
        event: 'OrderCancelled(indexed address,uint256)',
        handler: 'handleOrderCancelled',
      },
      {
        event: 'OrderFilled(indexed address,uint256,uint256,uint256)',
        handler: 'handleOrderFilled',
      },
    ],
  },
};

module.exports = {
  specVersion: '0.0.2',
  description: 'Kwenta Futures API',
  repository: 'https://github.com/kwenta/kwenta-subgraph',
  schema: {
    file: './futures.graphql',
  },
  dataSources: manifest,
  templates: [marginBaseTemplate, futuresMarketTemplate],
};
