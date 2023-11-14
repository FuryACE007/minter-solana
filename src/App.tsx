import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import WalletComponent from "./WalletComponent";

// Don't miss this, u'll spend hours scratching your head thinking why it isn't working XD
require("@solana/wallet-adapter-react-ui/styles.css");

function App() {
  const rpcEndpoint =
    "https://solana-devnet.g.alchemy.com/v2/" +
    process.env.REACT_APP_RPC_ENDPOINT;

  const solNetwork = WalletAdapterNetwork.Devnet;
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [solNetwork]
  );

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
