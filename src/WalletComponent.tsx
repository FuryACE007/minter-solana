/*------------------------------------------------------------------------------------------------------------------------------
  - This wallet component is wrapped by the Solana Wallet Adapter's wrappers
  - This contains the logic for creating and minting fungible tokens
  - The detailed output of the project can be seen in the console log.
  */

import { Box, Button, TextField, Typography } from "@mui/material";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useRef, useState } from "react";
import {
  generateSigner,
  percentAmount,
  signerIdentity,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { createSignerFromWalletAdapter } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  TokenStandard,
  createFungibleAsset,
  mintV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { useUmi } from "./useUmi";
import { ToastContainer, toast } from "react-toastify";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import "react-toastify/dist/ReactToastify.css";

function WalletComponent() {
  // We are extracting the user input using the useRef() hook
  const [balance, setBalance] = useState(0);
  const [canMintTokens, setCanMintTokens] = useState(false);

  const tokenNameRef = useRef<HTMLInputElement | null>(null);
  const tokenSymbolRef = useRef<HTMLInputElement | null>(null);
  const tokenDescriptionRef = useRef<HTMLInputElement | null>(null);
  const mintAmountRef = useRef<HTMLInputElement | null>(null);
  const numOfConsumbaleWallets = useRef<HTMLInputElement | null>(null);

  // Using the solana wallet adapter to get the connection object and the wallet instance ( to be used only after connecting the wallet )

  const { connection } = useConnection();
  const wallet = useWallet();

  // Using the Helius devnet rpc endpoint
  // const rpcEndpoint = process.env.REACT_APP_RPC_ENDPOINT;

  // using our custom hook 'useUmi' to get an instance of the umi
  const umi = useUmi();
  const [mint, setMint] = useState(generateSigner(umi));

  // if (!rpcEndpoint) return <div>Loading</div>; // for type checking, avoid undefined rpcEndpoint

  if (connection && wallet.publicKey) {
    connection.getAccountInfo(wallet.publicKey).then((info) => {
      if (info?.lamports != null) {
        setBalance(info?.lamports / LAMPORTS_PER_SOL);
      } else console.log("No money :(");
    });
  }

  // price calculation function
  const calculateMintPriceInLamports = (amount: number) => {
    const lamports = amount * 0.0001 * LAMPORTS_PER_SOL; // 0.0001 SOLs per token
    return lamports;
  };

  // function triggered when the 'Mint Token' button is clicked
  const submitHandler = async () => {
    // checking if the web app is connected to the wallet
    if (!connection || !wallet.publicKey) {
      return;
    }
    console.log("Pubkey", wallet.publicKey);

    // Checking the connected wallet's SOL balance
    await connection.getAccountInfo(wallet.publicKey).then((info) => {
      if (info?.lamports != null) {
        setBalance(info?.lamports / LAMPORTS_PER_SOL);
      } else {
        toast.error("You have insufficient SOL tokens!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    });

    // Using the connected wallet as the signer for the umi instance
    umi.use(signerIdentity(createSignerFromWalletAdapter(wallet)));

    const tokenName = tokenNameRef.current?.value || "";
    const tokenSymbol = tokenSymbolRef.current?.value || "";
    const tokenDescription = tokenDescriptionRef.current?.value || "";

    console.log("WalletComponent:PubKey", wallet.publicKey);
    console.log(tokenName, tokenSymbol, tokenDescription);

    const mint = generateSigner(umi);
    setMint(mint);
    const tokenMetadata = {
      tokenName,
      tokenSymbol,
      tokenDescription,
    };

    // upload the tokenMetadata to irys ( previously bundlr)
    const uri = await umi.uploader.uploadJson([tokenMetadata]);

    console.log("TokenMetadata uploaded successfully", uri);

    // create the fungible token

    createFungibleAsset(umi, {
      mint,
      name: tokenMetadata.tokenName,
      symbol: tokenMetadata.tokenSymbol,
      uri: uri,
      sellerFeeBasisPoints: percentAmount(0),
      isMutable: true,
      isCollection: false,
      authority: umi.identity,
      decimals: 3, // the divisibility of the fungible token
    })
      .sendAndConfirm(umi)
      .then(() => {
        console.log(
          tokenMetadata.tokenName + "created successfully: ",
          mint.publicKey
        );
        toast.success("🦄 Token created successfully!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setCanMintTokens(true);
      });
  };
  // Minting the fungible token using the mpl-token-metadata library's mintV1 function
  const mintHandler = () => {
    const tokensToMint = mintAmountRef.current?.value || 0;
    const mintPrice = calculateMintPriceInLamports(+tokensToMint);
    mintV1(umi, {
      mint: mint.publicKey,
      authority: umi.identity,
      amount: +tokensToMint,
      tokenOwner: umi.identity.publicKey,
      tokenStandard: TokenStandard.Fungible,
    })
      .sendAndConfirm(umi, { send: { skipPreflight: true } }) // preflight is Solana's simulation of the txn, if simulation fails, txn is failed and not even sent to the chains
      .then(() => {
        console.log("minted successfully!");
        toast.success("🦄 Token minted successfully!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      });
  };

  const createWalletHandler = async () => {
    const wallets = [];
    const consumableWallets = numOfConsumbaleWallets.current?.value || "0";
    for (let i = 0; i < +consumableWallets; i++) {
      // generate wallet
      const mnemonic = generateMnemonic();

      // Load waller from the mnemonic
      const seed = mnemonicToSeedSync(mnemonic);
      const seed32 = new Uint8Array(seed.toJSON().data.slice(0, 32));
      const keypair = Keypair.fromSeed(seed32); // this is loading the wallet from the seed

      wallets.push(seed32);
    }
    console.log("Wallets created! ", wallets);
  };

  const resetHandler = () => {
    setCanMintTokens(false);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        bgcolor: "#BEADFA",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <Typography variant="h5" color="secondary">
          Token Minting Machine
        </Typography>
        <WalletMultiButton />
        <Typography variant="subtitle1" sx={{ color: "#3D30A2" }}>
          Wallet Balance: {balance} SOL
        </Typography>
        <TextField
          id="token-name"
          label="Token Name"
          variant="outlined"
          placeholder="Enter the Token name"
          inputRef={tokenNameRef}
          required
        />
        <TextField
          id="token-symbol"
          label="Token Symbol"
          variant="outlined"
          placeholder="$TOKEN"
          inputRef={tokenSymbolRef}
          required
        />
        <TextField
          id="token-description"
          label="Token Description"
          multiline
          rows={4}
          variant="outlined"
          placeholder="Enter the Token description"
          inputRef={tokenDescriptionRef}
          required
        />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <ToastContainer />
        <Button variant="contained" color="secondary" onClick={submitHandler}>
          Create Token
        </Button>
        {canMintTokens && (
          <Box>
            <TextField
              id="mint-amount"
              label="Number of Tokens to mint"
              variant="outlined"
              placeholder=" Enter required number of tokens * 1000"
              inputRef={mintAmountRef}
              required
            />

            <Button variant="contained" color="secondary" onClick={mintHandler}>
              Mint Token
            </Button>

            <Button
              variant="contained"
              color="secondary"
              sx={{ margin: "0.3rem" }}
              onClick={resetHandler}
            >
              Reset Token
            </Button>
          </Box>
        )}
        <TextField
          id="number-of-consumable-wallets"
          label="Enter the number of consumable wallets to create:"
          variant="outlined"
          inputRef={numOfConsumbaleWallets}
        />
        <Button
          variant="contained"
          color="secondary"
          sx={{ margin: "0.3rem" }}
          onClick={createWalletHandler}
        >
          {" "}
          Create Wallets{" "}
        </Button>
      </Box>
    </Box>
  );
}

export default WalletComponent;
