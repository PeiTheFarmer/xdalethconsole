// This file serves both as a simple example and as documentation
// of the RPC testing endpoints in cpp-ethereum.
// Note that this does not (yet) work with geth!
// Install cpp-ethereum from the ubuntu dev ppa, start it in test-mode:
// $ eth --test -d /tmp/test &
// Wait for it to start up and then run this file:
// ethconsole example.js /tmp/test/geth.ipc

// The testing RPC interfaces are:
// test_setChainParams({}) -> bool: set chain parameters using the json chain description
//           you can use the function chainParams from this file to create such a description
// test_mineBlocks(x) -> bool: start mining and stop again after exactly x blocks
// test_modifyTimestamp(x) -> bool: set the timestamp of the current block to x
// test_rewindToBlock(x) -> bool: rewind the blockchain to block number x
// test_addBlock(x) -> bool: inject an RLP-encoded block


function chainParams(options) {
  var params = {
    sealEngine: 'NoProof',
    options: {},
    params: {
      accountStartNonce: '0x',
      maximumExtraDataSize: '0x1000000',
      blockReward: '0x',
      allowFutureBlocks: '1'
    },
    genesis: {
      author: '0000000000000010000000000000000000000000',
      timestamp: '0x00',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      extraData: '0x',
      gasLimit: '0x1000000000000'
    },
    accounts: {
      '0000000000000000000000000000000000000001': { 'wei': '1', 'precompiled': { 'name': 'ecrecover', 'linear': { 'base': 3000, 'word': 0 } } },
      '0000000000000000000000000000000000000002': { 'wei': '1', 'precompiled': { 'name': 'sha256', 'linear': { 'base': 60, 'word': 12 } } },
      '0000000000000000000000000000000000000003': { 'wei': '1', 'precompiled': { 'name': 'ripemd160', 'linear': { 'base': 600, 'word': 120 } } },
      '0000000000000000000000000000000000000004': { 'wei': '1', 'precompiled': { 'name': 'identity', 'linear': { 'base': 15, 'word': 3 } } },
      'c0c2c08481d2bde7d709c33534c526491871b25c': { 'wei': '1606938044258990275541962092341162602522202993782792835301376' }
    }
  };
  if (options.accounts !== undefined) {
    for (var address in options.accounts) {
      params.accounts[address] = { wei: options.accounts[address] };
    }
  }
  return params;
};


var logError = function(err) {
  if (err) {
    console.log("Error: " + err);
    process.exit(1);
  }
}


// ADD custom test methods
web3.extend({
            property: 'test',
            methods:
            [
                {
                    name: 'setChainParams',
                    call: 'test_setChainParams',
                    params: 1,
                    outputFormatter: web3.extend.formatters.formatOutputBool
                },
                {
                    name: 'mineBlocks',
                    call: 'test_mineBlocks',
                    params: 1,
                    inputFormatter: [web3.extend.utils.formatInputInt],
                    outputFormatter: web3.extend.formatters.formatOutputBool
                },
                {
                    name: 'modifyTimestamp',
                    call: 'test_modifyTimestamp',
                    params: 1,
                    inputFormatter: [web3.extend.utils.formatInputInt],
                    outputFormatter: web3.extend.formatters.formatOutputBool
                },
                {
                    name: 'addBlock',
                    call: 'test_addBlock',
                    params: 1,
                    inputFormatter: [web3.extend.utils.formatInputString],
                    outputFormatter: web3.extend.formatters.formatOutputBool
                },
                {
                    name: 'rewindToBlock',
                    call: 'test_rewindToBlock',
                    params: 1,
                    inputFormatter: [web3.extend.utils.formatInputInt],
                    outputFormatter: web3.extend.formatters.formatOutputBool
                }
            ]
        });


// Run tests
console.log("Creating new test account...");
web3.eth.personal.newAccount('', function(err, mainAccount) {
  logError(err);
  // Modify the chain parameters / genesis block to provide funding to a
  // certain account.
  web3.test.setChainParams(chainParams({accounts: { mainAccount: '1000000000000000000000'}}), function (err) {
    logError(err);
    console.log("Created new genesis block.");
    var secondAccount = '0x1234567890123456789012345678901234567890';
    web3.eth.sendTransaction({from: mainAccount, to: secondAccount, value: 200}, function(err, result) {
      logError(err);
      console.log("Transaction sent, mining 50 blocks...");
      web3.test.mineBlocks(50, function(err) {
        logError(err);
        console.log("Waiting for blocks to be mined...");
        var loop = function() {
          web3.eth.getBlockNumber(function(err, blockNr) {
            logError(err);
            console.log("Current block number: " + blockNr);
            if (blockNr < 50) {
              setTimeout(loop, 50);
            } else {
              console.log("Modifying timestamp.");
              web3.test.modifyTimestamp(1499356834, function(err) {
                logError(err);
                console.log("Done!");
                process.exit(0);
              });
            }
          });
        };
        loop();
      });
    });
  });
});