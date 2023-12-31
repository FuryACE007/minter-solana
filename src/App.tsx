// This component basically wraps the WalletComponent in thw solana wallet adapter wrappers
import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
// import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import WalletComponent from "./WalletComponent";

// Don't miss this, u'll spend hours scratching your head thinking why it isn't working XD
require("@solana/wallet-adapter-react-ui/styles.css");

function App() {
  const rpcEndpoint = process.env.REACT_APP_RPC_ENDPOINT;
  const wallets = useMemo(() => [], []);
  if (!rpcEndpoint) {
    return <div>RPC Not ready</div>;
  }

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <WalletComponent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
