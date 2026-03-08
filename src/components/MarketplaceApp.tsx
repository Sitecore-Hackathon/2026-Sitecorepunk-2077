"use client";

import { useState, useEffect } from "react";
import { Vibecore } from "@/components/Vibecore";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";

function isInIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function MarketplaceApp() {
  const [ready, setReady] = useState(false);
  const [inSitecore, setInSitecore] = useState(false);

  useEffect(() => {
    const iframe = isInIframe();
    setInSitecore(iframe);
    setReady(true);
  }, []);

  // Conditionally initialize SDK only when inside Sitecore.
  // Must be called unconditionally (React hook rules), but autoInit
  // controls whether it actually tries to connect to the host.
  const { client: sdkClient } = useMarketplaceClient({
    autoInit: inSitecore && ready,
  });

  if (!ready) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <Vibecore
      isInSitecore={inSitecore}
      sdkClient={sdkClient ?? undefined}
    />
  );
}
