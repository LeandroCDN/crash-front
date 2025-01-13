"use client";
import { MiniKit } from "@worldcoin/minikit-js";
import { useEffect, useState } from "react";
import CrashGame from "../game";

export function SignIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const signInWithWallet = async () => {
    console.log("sig in");
    if (!MiniKit.isInstalled()) {
      return;
    }
    const res = await fetch(`/api/nonce`);
    const { nonce } = await res.json();
    const { commandPayload: generateMessageResult, finalPayload } =
      await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: "0", // Optional
        expirationTime: new Date(new Date().getTime() + 300 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement:
          "This is my statement and here is a link https://worldcoin.com/apps",
      }); // throws: not an object

    if (MiniKit.walletAddress != null) {
      setIsLoggedIn(true);
    }
    console.log(MiniKit.walletAddress); // return user wallet :3
  };

  useEffect(() => {
    const timeoutIdSigIn = setTimeout(() => {
      signInWithWallet();
    }, 0);
    return () => clearTimeout(timeoutIdSigIn);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen">
      <div className="flex flex-col w-screen h-screen items-center justify-between">
        {isLoggedIn ? (
          <CrashGame />
        ) : (
          <div>
            <button onClick={signInWithWallet}>
              <p className="text-4xl px-8 py-2 text-white">LOGIN</p>
            </button>
            <div>
              <h1 className="">MEME RACING</h1>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
