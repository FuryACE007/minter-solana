import React, { useRef, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Box, Button, TextField, Typography } from "@mui/material";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

function App() {
  const tokenNameRef = useRef<HTMLInputElement | null>(null);
  const tokenSymbolRef = useRef<HTMLInputElement | null>(null);
  const tokenDescriptionRef = useRef<HTMLInputElement | null>(null);

  const [tokenName, setTokenName] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  const rpcEndpoint =
    "https://solana-devnet.g.alchemy.com/v2/" +
    process.env.REACT_APP_RPC_ENDPOINT;

  const wallet = new PhantomWalletAdapter();

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <WalletProvider wallets={[wallet]}>
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
            <Button variant="contained" color="secondary">
              Mint Token
            </Button>
          </Box>
        </Box>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
