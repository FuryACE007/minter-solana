import { Box, Button, TextField, Typography } from "@mui/material";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRef, useState } from "react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { signerIdentity } from "@metaplex-foundation/umi";
import { createSignerFromWalletAdapter } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createFungibleAsset } from "@metaplex-foundation/mpl-token-metadata";
import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

function WalletComponent() {
  const tokenNameRef = useRef<HTMLInputElement | null>(null);
  const tokenSymbolRef = useRef<HTMLInputElement | null>(null);
  const tokenDescriptionRef = useRef<HTMLInputElement | null>(null);

  const [tokenName, setTokenName] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  const { connection } = useConnection();
  //   const { publicKey } = useWallet();
  const wallet = useWallet();

  const rpcEndpoint = process.env.REACT_APP_RPC_ENDPOINT;

  if (!rpcEndpoint) return <div>Loading</div>;

  const umi = createUmi(rpcEndpoint).use(mplTokenMetadata());

  const submitHandler = async () => {
    if (!connection || !wallet.publicKey) {
      return;
    }
    console.log("Pubkey", wallet.publicKey);

    await connection.getAccountInfo(wallet.publicKey).then((info) => {
      if (info?.lamports != null)
        console.log("Account balances", info?.lamports / LAMPORTS_PER_SOL);
      else console.log("No money :(");
    });

    umi.use(signerIdentity(createSignerFromWalletAdapter(wallet)));

    setTokenName(tokenNameRef.current?.value || "");
    setTokenSymbol(tokenSymbolRef.current?.value || "");
    setTokenDescription(tokenDescriptionRef.current?.value || "");

    // Create Token
    

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
        <TextField
          id="token-name"
          label="Token Name"
          variant="outlined"
          placeholder="Enter the Token name"
          ref={tokenNameRef}
        />
        <TextField
          id="token-symbol"
          label="Token Symbol"
          variant="outlined"
          placeholder="$TOKEN"
          ref={tokenSymbolRef}
        />
        <TextField
          id="token-description"
          label="Token Description"
          multiline
          rows={4}
          variant="outlined"
          placeholder="Enter the Token description"
          ref={tokenDescriptionRef}
        />
        <Button variant="contained" color="secondary" onClick={submitHandler}>
          Mint Token
        </Button>
      </Box>
    </Box>
  );
}

export default WalletComponent;
