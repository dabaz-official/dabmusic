"use client";

import { useEffect } from "react";

/**
 * Registers `public/sw.js`, the offline shell. Production only: caching dev
 * output would serve stale HMR chunks, and the worker is scoped to the origin
 * so it keeps serving after the first visit.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((error: unknown) => {
          console.error("Service worker registration failed", error);
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
