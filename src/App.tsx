import React from "react";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Box, Button, TextField, Typography } from "@mui/material";

function App() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        bgcolor: "white",
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
        <Typography variant="h5">Token Minting Machine</Typography>
        <TextField id="token-name" label="Token Name" variant="outlined" placeholder="Enter the Token name" />
        <TextField id="token-symbol" label="Token Symbol" variant="outlined" placeholder="$TOKEN" />
        <TextField
          id="token-description"
          label="Token Description"
          multiline
          rows={4}
          variant="outlined"
          placeholder="Enter the Token description"
        />
        <Button variant="contained" color="primary">
          Submit
        </Button>
      </Box>
    </Box>
  );
}

export default App;
