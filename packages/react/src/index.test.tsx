import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { expect, test, vi } from "vitest";
import { GroundControlProvider, useFeatureFlag } from ".";

const apiKey = `gcp_${Date.now()}`;
const projectId = `P${Date.now()}`;
const flagName = `flag-name-${Date.now()}`;

const _fetch = vi.fn(async () => {
  return {
    ok: true,
    json: async () => {
      return {
        enabled: true,
      };
    },
  };
});

test("checks the status of a feature flag", async () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GroundControlProvider
      apiKey={apiKey}
      projectId={projectId}
      fetch={_fetch as unknown as typeof fetch}
    >
      {children}
    </GroundControlProvider>
  );

  const { result } = renderHook(() => useFeatureFlag(flagName), {
    wrapper,
  });

  expect(result.current).toBe(false);
  await waitFor(() => expect(result.current).toBe(true));

  expect(_fetch).toHaveBeenCalledWith(
    `https://api.groundcontrol.sh/projects/${projectId}/flags/${flagName}/check?`,
    {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
    }
  );
});
