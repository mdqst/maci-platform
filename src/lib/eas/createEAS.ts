import { type providers } from "ethers";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { type SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";

import * as config from "~/config";

export function createEAS(signer: providers.JsonRpcSigner): EAS {
  console.log("Creating EAS instance");
  const eas = new EAS(config.eas.contracts.eas);
  console.log("Connecting signer to EAS");
  return eas.connect(signer as unknown as SignerOrProvider);
}
