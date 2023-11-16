import { Box, Button, TextField, Typography } from "@mui/material";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRef } from "react";
import {
  createGenericFileFromJson,
  generateSigner,
  percentAmount,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createSignerFromWalletAdapter } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createFungibleAsset } from "@metaplex-foundation/mpl-token-metadata";
import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { useUmi } from "./useUmi";

function WalletComponent() {
  const tokenNameRef = useRef<HTMLInputElement | null>(null);
  const tokenSymbolRef = useRef<HTMLInputElement | null>(null);
  const tokenDescriptionRef = useRef<HTMLInputElement | null>(null);

  const { connection } = useConnection();
  const wallet = useWallet();

  const rpcEndpoint = process.env.REACT_APP_RPC_ENDPOINT;

  const umi = useUmi();

  if (!rpcEndpoint) return <div>Loading</div>;

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

    const tokenName = tokenNameRef.current?.value || "";
    const tokenSymbol = tokenSymbolRef.current?.value || "";
    const tokenDescription = tokenDescriptionRef.current?.value || "";

    console.log("WalletComponent:PubKey", wallet.publicKey);
    console.log(tokenName, tokenSymbol, tokenDescription);

    // Create Token
    const mint = generateSigner(umi);
    const tokenMetadata = {
      tokenName,
      tokenSymbol,
      tokenDescription
    }
    // const tokenMetadataFile = createGenericFileFromJson(tokenMetadata);

    // upload the tokenMetadata
    const uri = await umi.uploader.uploadJson([tokenMetadata]);

    console.log("TokenMetadata uploaded successfully", uri);

    createFungibleAsset(umi, {
      mint,
      name: tokenMetadata.tokenName,
      symbol: tokenMetadata.tokenSymbol,
      uri: uri,
      sellerFeeBasisPoints: percentAmount(0),
      isMutable: true,
      isCollection: false,
      authority: umi.identity,
      decimals: 9,
      // amount: 10000,
      // tokenOwner: umi.identity.publicKey
    }).sendAndConfirm(umi).then(() => {
      console.log(tokenMetadata.tokenName + "minted successfully: ", mint.publicKey);
    });
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
        <Button variant="contained" color="secondary" onClick={submitHandler}>
          Mint Token
        </Button>
      </Box>
    </Box>
  );
}

export default WalletComponent;
