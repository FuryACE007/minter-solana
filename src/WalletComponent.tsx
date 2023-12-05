/*------------------------------------------------------------------------------------------------------------------------------
  - This wallet component is wrapped by the Solana Wallet Adapter's wrappers
  - This contains the logic for creating and minting fungible tokens
  - The detailed output of the project can be seen in the console log.
  */

import { Box, Button, TextField, Typography, Divider } from "@mui/material";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRef, useState } from "react";
import {
  SolAmount,
  generateSigner,
  percentAmount,
  publicKey,
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
import { transferSol } from "@metaplex-foundation/mpl-toolbox";

function WalletComponent() {
  // We are extracting the user input using the useRef() hook
  const [balance, setBalance] = useState(0);
  const [canMintTokens, setCanMintTokens] = useState(false);
  const [walletsLength, setWalletsLength] = useState(0);
  const [mnemonics, setMnemonics] = useState([""]);

  const tokenNameRef = useRef<HTMLInputElement | null>(null);
  const tokenSymbolRef = useRef<HTMLInputElement | null>(null);
  const tokenDescriptionRef = useRef<HTMLInputElement | null>(null);
  const mintAmountRef = useRef<HTMLInputElement | null>(null);
  const numOfConsumbaleWalletsRef = useRef<HTMLInputElement | null>(null);
  const amountOfTokensPerWalletRef = useRef<HTMLInputElement | null>(null);

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
    const lamports = amount * 0.0000001 * LAMPORTS_PER_SOL; // 0.0000001 SOLs per token
    return Math.ceil(lamports);
  };

  // function triggered when the 'Create Token' button is clicked
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
          autoClose: 1000,
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
      authority: umi.identity, // the address which is allowed to mint the tokens
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
          autoClose: 1000,
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
    mintV1(umi, {
      mint: mint.publicKey,
      authority: umi.identity,
      amount: +tokensToMint * 1000,
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
    const consumableWallets = numOfConsumbaleWalletsRef.current?.value || "0";
    const batchSize = 7;

    // There are 1000 tokens per wallet, and say we have 10 wallets, loop 10 times and add mintV1 for each wallet

    for (
      let batchIndex = 0;
      batchIndex < Math.ceil(+consumableWallets / batchSize);
      batchIndex++
    ) {
      let txBuilder = transactionBuilder();

      const price = calculateMintPriceInLamports(+consumableWallets * 1000); // 1000 tokens per wallet
      const solprice: SolAmount = {
        identifier: "SOL",
        decimals: 9,
        basisPoints: BigInt(price),
      };
      // Accepting fee for the tokens
      txBuilder = txBuilder.add(
        transferSol(umi, {
          source: umi.payer,
          destination: publicKey(
            "3moPQrUksj91Pu1LWCAWH8FzQEEQocwBbMCmC1Rc1EaM" // LUCID Wallet Address
          ),
          amount: solprice,
        })
      );

      const start = batchIndex * batchSize;
      const end = Math.min((batchIndex + 1) * batchSize, +consumableWallets);

      for (let i = start; i < end; i++) {
        // generate wallet
        const mnemonic = generateMnemonic();

        // Load waller from the mnemonic
        const seed = mnemonicToSeedSync(mnemonic);
        const seed32 = new Uint8Array(seed.toJSON().data.slice(0, 32));
        const keypair = Keypair.fromSeed(seed32); // this is loading the wallet from the seed
        wallets.push(mnemonic);

        /* Minting tokens into the consumable wallet */
        const amountOfTokensPerWallet =
          amountOfTokensPerWalletRef.current?.value || "0";

        txBuilder = txBuilder.add(
          mintV1(umi, {
            mint: publicKey("2uT3YF6v5178p5mkx62ak11HHmVoxgbzrG9dfhtF879e"), // Minting only the White Toner Cartridge Token
            authority: umi.identity, // The OEM would mint the tokens on behalf of the consumable wallets
            amount: +amountOfTokensPerWallet * 1000, // decimal value of token: 1000
            tokenOwner: publicKey(keypair.publicKey),
            tokenStandard: TokenStandard.Fungible,
          })
        );

        /* Funding the wallets with some SOLs to be able to pay their fees */
        const txPrice: SolAmount = {
          identifier: "SOL",
          decimals: 9,
          basisPoints: BigInt(1000000), // 1000000000 = 1 SOL, 0.001 SOL
        };

        txBuilder = txBuilder.add(
          transferSol(umi, {
            source: umi.payer,
            destination: publicKey(keypair.publicKey),
            amount: txPrice,
          })
        );
      }
      console.log(wallets);
      setWalletsLength(wallets.length);
      setMnemonics(wallets);

      // Signing the transaction
      const confirmResult = await txBuilder.sendAndConfirm(umi); // Builds the txns, sends it and confirms the transaction

      confirmResult && console.log("Txn signature: " + confirmResult);
      confirmResult
        ? toast.success("🦄 Wallets created successfully", {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          })
        : toast.error("Txn failed", {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
    }
  };

  const resetHandler = () => {
    setCanMintTokens(false);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
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
        <Divider />
        <TextField
          id="number-of-consumable-wallets"
          label="Enter the number of consumable wallets to create:"
          variant="outlined"
          inputRef={numOfConsumbaleWalletsRef}
        />
        <TextField
          id="amount-of-tokens-per-wallet"
          label="Enter the number of WTC tokens per wallet: "
          variant="outlined"
          inputRef={amountOfTokensPerWalletRef}
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
        {mnemonics.length > 0 &&
          mnemonics.map((mnemonic) => (
            <Typography variant="body2"> // {mnemonic} //</Typography>
          ))}
      </Box>
    </Box>
  );
}

export default WalletComponent;
