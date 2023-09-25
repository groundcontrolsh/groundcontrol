import React from "react";
import { PropsWithChildren } from "react";
import { useEffect, useState, createContext, useContext } from "react";
import {
  FeatureFlagCheckOptions,
  GroundControlClient,
} from "@groundcontrolsh/groundcontrol";

// We store results in a cache because to avoid hooks to flap between enabled/disabled even if the server always returns enabled=true.
// The flapping happens because React components render synchronously, and even if we use cache headers and responses are cached, fetch() is always async.
// So by default, always, we want to use the latest value we got from the server.
const caches = new WeakMap<GroundControlClient, Cache>();

class Cache {
  data: Record<string, boolean> = {};

  setCached(
    flagName: string,
    options: FeatureFlagCheckOptions | undefined,
    enabled: boolean
  ) {
    const key = this.#createKey(flagName, options);
    this.data[key] = enabled;
  }

  getCached(flagName: string, options: FeatureFlagCheckOptions | undefined) {
    const key = this.#createKey(flagName, options);
    const value = this.data[key];
    if (!value) return null;
    return value;
  }

  #createKey(flagName: string, options: FeatureFlagCheckOptions | undefined) {
    return JSON.stringify({ flagName, options });
  }
}

const GroundControlContext = createContext<GroundControlClient | null>(null);

export const GroundControlProvider: React.FC<
  PropsWithChildren<{ client: GroundControlClient }>
> = ({ children, client }) => {
  return (
    <GroundControlContext.Provider value={client}>
      {children}
    </GroundControlContext.Provider>
  );
};

export function useFeatureFlag(
  flagName: string,
  options?: FeatureFlagCheckOptions
) {
  const client = useContext(GroundControlContext);
  if (!client) throw new Error("Missing GroundControlProvider");

  const key = (options?.actors || []).join("\n");
  const cache = caches.get(client) ?? new Cache();
  caches.set(client, cache);
  const cached = cache.getCached(flagName, options);
  const [enabled, setEnabled] = useState(cached ?? false);

  useEffect(() => {
    client.isFeatureFlagEnabled(flagName, options).then((enabled) => {
      cache.setCached(flagName, options, enabled);
      setEnabled(enabled);
    });
  }, [flagName, key]);

  return cached !== null ? cached : enabled;
}
