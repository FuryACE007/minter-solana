import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Umi } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useMemo } from "react";

// type UmiContext = {
//   umi: Umi | null;
// };

// const DEFAULT_CONTEXT: UmiContext = {
//   umi: null,
// };

// export const UmiContext = createContext<UmiContext>(DEFAULT_CONTEXT);

export function useUmi(): Umi {
  const wallet = useWallet();
  const rpcEndpoint = process.env.REACT_APP_RPC_ENDPOINT;

  if (!rpcEndpoint) {
    throw new Error("RPC endpoint is not defined. ");
  }

  //   const umi = useContext(UmiContext).umi;

  const umi = useMemo(() => {
    return createUmi(rpcEndpoint)
      .use(walletAdapterIdentity(wallet))
      .use(mplTokenMetadata())
      .use(
        irysUploader({
          address: "https://devnet.irys.xyz",
        })
      );
  }, [wallet]);

  if (!umi) {
    throw new Error(
      "Umi context was not initialized. " +
        "Did you forget to wrap your app with <UmiProvider />?"
    );
  }
  return umi;
}
