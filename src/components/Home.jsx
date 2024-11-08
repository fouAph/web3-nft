import WalletBalance from './WalletBalance';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import FiredGuys from '../artifacts/contracts/MyNFT.sol/ScreamChicken.json';

const contractAddress = '0xb5EB4Ee13a312DEc69127c0a88f997EbF62Ee517';

const provider = new ethers.providers.Web3Provider(window.ethereum);
provider.getTransactionCount();

// get the end user
const signer = provider.getSigner();

// get the smart contract
const contract = new ethers.Contract(contractAddress, FiredGuys.abi, signer);

function Home() {
  const [totalMinted, setTotalMinted] = useState(0);
  const [currentUserAddress, setCurrentUserAddress] = useState(null);

  useEffect(() => {
    getCount();
    getCurrentUserAddress();
  }, []);

  const getCount = async () => {
    const count = await contract.count();
    setTotalMinted(parseInt(count));
  };

  const getCurrentUserAddress = async () => {
    const address = await signer.getAddress();
    setCurrentUserAddress(address);
  };

  return (
    <div>
      <WalletBalance />
      <h1>Chicken Scream</h1>
      <div className="container">
        <div className="row">
          {Array(totalMinted + 1)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="col-sm">
                <div className="nft-image-container">
                  <NFTImage tokenId={i} currentUserAddress={currentUserAddress} />
                </div>
              </div>
            ))}
        </div>
      </div>
      <div>
        <div className="container" style={{ marginTop: '100px' }}>
          <h1>Listed Chicken Scream Token</h1>
          <div className="row">
            {Array(totalMinted + 1)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="col-sm">
                  <div className="listed-nft-image-container">
                    <ListedNFTImage tokenId={i} currentUserAddress={currentUserAddress} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );



}

function NFTImage({ tokenId, getCount }) {
  const jsonCID = 'QmZCerU5oQX1qrNFkk8MUSMtY3s5PETiVMDVi4HX1JBSpW';
  const imgCID = 'QmeNw5yRnJAWduXXC2ccLRJNG9MNk84WYhQ6KLr9TaqcmJ';
  const metadataURI = `https://moccasin-managing-butterfly-758.mypinata.cloud/ipfs/${jsonCID}/${tokenId}.json`;
  const imageURI = `https://moccasin-managing-butterfly-758.mypinata.cloud/ipfs/${imgCID}/${tokenId}.png`;
  //const imageURI = `img/${tokenId}.png`;  //ini untuk local image, jadi simpan imagenya di folder img/

  const [contractOwner, setContractOwner] = useState(null);
  const [isMinted, setIsMinted] = useState(false);
  const [isListedForSale, setIsListedForSale] = useState(false);
  const [salePrice, setSalePrice] = useState(null);
  const [owner, setOwner] = useState(null);
  const [currentUserAddress, setCurrentUserAddress] = useState(null);
  const [isBurned, setIsBurned] = useState(null);

  useEffect(() => {
    getContractOwner();
    getMintedStatus();
    getSaleStatus();
    getCurrentUserAddress();
    checkIfBurnedNFTImage();
  }, [isMinted, isListedForSale]);

  const getContractOwner = async () => {
    const ownerAddress = await contract.owner();
    setContractOwner(ownerAddress);
  };

  const getMintedStatus = async () => {
    const result = await contract.isContentOwned(metadataURI);
    setIsMinted(result);
    console.log("Is minted:", result);
    console.log("meta data URI:", metadataURI);
    if (result) await getOwner();
  };

  // Check if the token is burned
  const checkIfBurnedNFTImage = async () => {
    const result = await contract.isContentOwned(metadataURI);
    setIsMinted(result);
    console.log("Is minted:", result);
    console.log("meta data URI:", metadataURI);
    if (result) await getOwner();

    try {              // token owner exists
      const address = await contract.ownerOf(tokenId); // but, when we try to get the owner, it throws an error, meaning the token owner is not exist
      setIsBurned(address == "0x0000000000000000000000000000000000000000" && result); // Token exists
    }

    catch (error) {           // token owner doesnt exist
      if (result === false) { // but, the token is not minted yet
        setIsBurned(false);   // so we assume the token is not burned
      }
      else                    // the token is minted
        setIsBurned(true);    // Token is burned

    }
  };

  const getSaleStatus = async () => {
    try {
      const price = await contract.tokenPrices(tokenId);
      setSalePrice(ethers.utils.formatEther(price));
      setIsListedForSale(price > 0);
    } catch {
      setIsListedForSale(false);
      setSalePrice(null);
    }
  };

  const getCurrentUserAddress = async () => {
    const address = await signer.getAddress();
    setCurrentUserAddress(address);
  };

  const getOwner = async () => {
    try {
      const ownerAddress = await contract.ownerOf(tokenId);
      setOwner(ownerAddress);

    } catch (error) {
      if (isBurned)
        console.error("Error fetching owner:", error);
    }
  };

  const getOwnerAlert = async () => {
    try {
      const ownerAddress = await contract.ownerOf(tokenId);
      setOwner(ownerAddress);
      alert(`Owner of Token ID #${tokenId}: ${ownerAddress}`);
    } catch (error) {
      console.error("Error fetching owner:", error);
    }
  };

  const mintToken = async () => {
    const connection = contract.connect(signer);
    const addr = await signer.getAddress();
    const result = await contract.payToMint(addr, metadataURI, {
      value: ethers.utils.parseEther('0.05'),
    });
    console.log("metadataURI :", metadataURI);
    await result.wait();
    getMintedStatus();
    getCount();
  };

  const burnToken = async () => {
    try {
      // Confirm if the user really wants to burn the token
      const confirmBurn = window.confirm("Are you sure you want to burn this token? This action is irreversible.");
      if (!confirmBurn) return;

      console.log("burn token");
      console.log("check if owner");
      if (currentUserAddress !== owner) {
        alert("You are not the owner of this token and cannot burn it.");
        return;
      }

      console.log("check if token exists");
      const tokenExists = await contract.ownerOf(tokenId);
      if (!tokenExists) {
        alert("The token does not exist.");
        return;
      }

      console.log("initiate burn token ", tokenId);
      await contract.burnToken(tokenId);
      alert("Token has been burned successfully.");
      getMintedStatus();
    } catch (error) {
      console.error("Burning error:", error);
      alert("An error occurred while burning the token. Check the console for details.");
    }
  };

  const cancelListing = async () => {
    // Confirm if the user really wants to cancel the listing
    const confirmCancel = window.confirm("Are you sure you want to cancel this listing?");
    if (!confirmCancel) return;

    try {
      await contract.cancelListing(tokenId);
      alert("Listing has been canceled successfully.");
      getSaleStatus();
    } catch (error) {
      console.error("Error canceling listing:", error);
      alert("An error occurred while canceling the listing. Check the console for details.");
    }
  };


  const sellToken = async () => {
    if (currentUserAddress !== owner) {
      alert("You are not the owner of this token and cannot sell it.");
      return;
    }
    const priceInEther = prompt("Enter sale price in Ether:");
    if (priceInEther) {
      const price = ethers.utils.parseEther(priceInEther);
      await contract.sell(tokenId, price);
      getSaleStatus();
    }
  };

  const buyToken = async () => {
    const price = ethers.utils.parseEther(salePrice);
    const result = await contract.buy(tokenId, { value: price });
    await result.wait();
    getMintedStatus();
    getSaleStatus();
  };

  async function getURI() {
    const uri = await contract.tokenURI(tokenId);
    alert(uri);
  }


  if (isBurned) return null;
  // Only render the component if the current user owns the NFT
  if (currentUserAddress !== owner && currentUserAddress !== contractOwner || isBurned)//|| currentUserAddress !== contractOwner)
    return null;

  return (
    <div className="card" style={{ width: '18rem' }}>
      <img className="card-img-top" src={isMinted ? imageURI : 'img/placeholder.png'} alt={`NFT ${tokenId}`} />
      <div className="card-body">
        <h5 className="card-title">ID #{tokenId}</h5>
        {!isMinted ? (
          <button className="btn btn-primary" onClick={mintToken}>
            Mint
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={getURI}>
              Show URI
            </button>
            <button className="btn btn-info" onClick={getOwnerAlert}>
              Show Owner
            </button>
            {currentUserAddress === owner && (
              <>
                {!isListedForSale ? (
                  <>
                    <button className="btn btn-warning" onClick={sellToken}>
                      Sell
                    </button>

                    <button className="btn btn-danger" onClick={burnToken}>
                      Burn token id #{tokenId}
                    </button>
                  </>
                ) :
                  <>
                    <text className="btn btn-warning" >
                      This token is listed for sale
                    </text>
                    <button className="btn btn-danger" onClick={cancelListing}>
                      Cancel listing
                    </button>
                  </>
                }


              </>
            )}
            {isListedForSale && currentUserAddress !== owner && (
              <button className="btn btn-success" onClick={buyToken}>
                Buy for {salePrice} ETH
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ListedNFTImage({ tokenId }) {
  const jsonCID = 'QmZCerU5oQX1qrNFkk8MUSMtY3s5PETiVMDVi4HX1JBSpW';
  const imgCID = 'QmeNw5yRnJAWduXXC2ccLRJNG9MNk84WYhQ6KLr9TaqcmJ';
  const metadataURI = `https://moccasin-managing-butterfly-758.mypinata.cloud/ipfs/${jsonCID}/${tokenId}.json`;
  const imageURI = `https://moccasin-managing-butterfly-758.mypinata.cloud/ipfs/${imgCID}/${tokenId}.png`;

  const [isMinted, setIsMinted] = useState(false);
  const [isListedForSale, setIsListedForSale] = useState(false);
  const [salePrice, setSalePrice] = useState(null);
  const [owner, setOwner] = useState(null);
  const [currentUserAddress, setCurrentUserAddress] = useState(null);

  useEffect(() => {
    getMintedStatus();
    getSaleStatus();
    getCurrentUserAddress();
  }, []);

  const getMintedStatus = async () => {
    const result = await contract.isContentOwned(metadataURI);
    setIsMinted(result);
    if (result) await getOwner();
  };

  const getSaleStatus = async () => {
    try {
      const price = await contract.tokenPrices(tokenId);
      setSalePrice(ethers.utils.formatEther(price));
      setIsListedForSale(price > 0);
    } catch {
      setIsListedForSale(false);
      setSalePrice(null);
    }
  };

  const getCurrentUserAddress = async () => {
    const address = await signer.getAddress();
    setCurrentUserAddress(address);
  };

  const getOwner = async () => {
    try {
      const ownerAddress = await contract.ownerOf(tokenId);
      setOwner(ownerAddress);
    } catch (error) {
      console.error("Error fetching owner:", error);
    }
  };

  const buyToken = async () => {
    const price = ethers.utils.parseEther(salePrice);
    const result = await contract.buy(tokenId, { value: price });
    await result.wait();
    getMintedStatus();
    getSaleStatus();
  };

  if (!isListedForSale) return null;

  return (
    <div className="card" style={{ width: '18rem' }}>
      <img className="card-img-top" src={isMinted ? imageURI : 'img/placeholder.png'} alt={`NFT ${tokenId}`} />
      <div className="card-body">
        <h5 className="card-title">ID #{tokenId}</h5>
        {isMinted && (
          <>
            <button className="btn btn-secondary" onClick={() => alert(metadataURI)}>
              Show URI
            </button>
            <button className="btn btn-info" onClick={() => alert(`Owner of Token ID #${tokenId}: ${owner}`)}>
              Show Owner
            </button>
            {currentUserAddress === owner && isListedForSale && (
              <span className="btn btn-warning">
                This token is yours and listed for sale
              </span>
            )}
            {isListedForSale && currentUserAddress !== owner && (
              <button className="btn btn-success" onClick={buyToken}>
                Buy for {salePrice} ETH
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
