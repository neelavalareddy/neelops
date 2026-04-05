"use client";

import { useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function WorldAppBootstrap() {
  useEffect(() => {
    MiniKit.install(process.env.NEXT_PUBLIC_WLD_APP_ID);
  }, []);

  return null;
}
