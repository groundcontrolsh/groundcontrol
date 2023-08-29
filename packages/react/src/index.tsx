import React from "react";
import { PropsWithChildren } from "react";
import { useEffect, useState, createContext, useContext } from "react";

type GroundControlProviderProps = {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
  cache?: number;
  onError?: (error: Error) => void;
  fetch?: typeof fetch;
};

const GroundControlContext = createContext<GroundControlProviderProps | null>(
  null
);

export const GroundControlProvider: React.FC<
  PropsWithChildren<GroundControlProviderProps>
> = ({ children, ...props }) => {
  return (
    <GroundControlContext.Provider value={props}>
      {children}
    </GroundControlContext.Provider>
  );
};

function defaultOnError(error: Error) {
  console.error(error);
}

export function useFeatureFlag(
  flagName: string,
  options?: { actors?: string[] }
) {
  const ctx = useContext(GroundControlContext);
  if (!ctx) throw new Error("Missing GroundControlProvider");

  const { projectId, apiKey, baseUrl } = ctx;
  const [enabled, setEnabled] = useState(false);
  const query = (options?.actors ?? [])
    .map((actorId) => `actorIds=${encodeURIComponent(actorId)}`)
    .concat(ctx.cache ? `cache=${ctx.cache}` : [])
    .join("&");

  useEffect(() => {
    setEnabled(false);

    const path = `/projects/${projectId}/flags/${flagName}/check?${query}`;

    const _fetch = ctx.fetch ?? global.fetch;

    _fetch(`${baseUrl ?? "https://api.groundcontrol.sh"}${path}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error(res.statusText);
      })
      .then((json) => {
        if (typeof json.enabled === "boolean") {
          setEnabled(json.enabled);
        } else {
          throw new Error("Invalid response");
        }
      })
      .catch(ctx.onError ?? defaultOnError);
  }, [flagName, query, projectId, apiKey]);

  return enabled;
}
