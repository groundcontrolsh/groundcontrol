import React from "react";
import { PropsWithChildren } from "react";
import { useEffect, useState, createContext, useContext } from "react";

type GroundControlProviderProps = {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
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

export function useFeatureFlag(flagName: string, ...actorIds: string[]) {
  const ctx = useContext(GroundControlContext);
  if (!ctx) throw new Error("Missing GroundControlProvider");

  const { projectId, apiKey, baseUrl } = ctx;
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(false);

    const query = actorIds
      .map((actorId) => `actorIds=${encodeURIComponent(actorId)}`)
      .join("&");
    const path = `/projects/${projectId}/flags/${flagName}/check?${query}`;

    fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error(res.statusText);
      })
      .then((json) => {
        if (json.enabled) setEnabled(true);
      })
      .catch(console.error);
  }, [flagName, actorIds, projectId, apiKey]);

  return enabled;
}
