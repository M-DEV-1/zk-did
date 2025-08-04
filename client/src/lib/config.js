// "use server" | this gives a certain "<DOCTYPE>" error
import { PinataSDK } from "pinata"
import dotenv from "dotenv"
dotenv.config();

const pinata = (() => {
  try {
    if (!process.env.PINATA_JWT || !process.env.NEXT_PUBLIC_GATEWAY_URL) {
      throw new Error("PINATA_JWT or NEXT_PUBLIC_GATEWAY_URL is not set");
    }

    return new PinataSDK({
      pinataJwt: `${process.env.PINATA_JWT}`,
      pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`
    });
  } catch (e) {
    console.error(e);
    return undefined;
  }
})();

export { pinata };