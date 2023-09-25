import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { expect, test, vi } from "vitest";
import { GroundControlProvider, useFeatureFlag } from ".";
import { GroundControlClient } from "@groundcontrolsh/groundcontrol";

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
  const client = new GroundControlClient({
    apiKey,
    projectId,
    fetch: _fetch as unknown as typeof fetch,
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GroundControlProvider client={client}>{children}</GroundControlProvider>
  );

  const { result } = renderHook(() => useFeatureFlag(flagName), {
    wrapper,
  });

  expect(result.current).toBe(false);
  await waitFor(() => expect(result.current).toBe(true));

  const { result: result2 } = renderHook(() => useFeatureFlag(flagName), {
    wrapper,
  });

  // when re-rendering it should return the cached value immediately
  expect(result2.current).toBe(true);

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
