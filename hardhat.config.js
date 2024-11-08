require("@nomiclabs/hardhat-waffle");
require("dotenv").config(); // Load environment variables
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const { LINEA_SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: './src/artifacts',
  },


  networks: {
    lineaSepolia: {
      url: `https://linea-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY]
    }
  },

  etherscan: {
    apiKey: {
      linea_sepolia: process.env.LINEASCAN_API_KEY
    },
    customChains: [
      {
        network: "linea_sepolia",
        chainId: 59141,
        urls: {
          apiURL: "https://api-sepolia.lineascan.build/api",
          browserURL: "https://sepolia.lineascan.build/address"
        }
      }
    ]
  }

  // networks: {
  //   matic: {
  //     url: "https://polygon-mumbai.g.alchemy.com/v2/YOUR_APP",
  //     accounts: ["MATIC_PRIVATE_KEY"]
  //   }
  // },
};
