import { Box, Button, TextField, Typography } from "@mui/material";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRef, useState } from "react";

function WalletComponent() {
  const tokenNameRef = useRef<HTMLInputElement | null>(null);
  const tokenSymbolRef = useRef<HTMLInputElement | null>(null);
  const tokenDescriptionRef = useRef<HTMLInputElement | null>(null);

  const [tokenName, setTokenName] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const submitHandler = async () => {
    if (!connection || !publicKey) {
      return;
    } else {
      console.log("Pubkey", publicKey);

      const accountSols = await connection
        .getAccountInfo(publicKey)
        .then((info) => {
          if (info?.lamports != null)
            console.log("Account balances", info?.lamports / LAMPORTS_PER_SOL);
          else console.log("No money :(");
        });
    }
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
