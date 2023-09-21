import { expect, test, vi } from "vitest";
import { GroundControlClient, GroundControlClientOptions } from ".";

const apiKey = `gcp_${Date.now()}`;
const projectId = `P${Date.now()}`;
const flagName = `flag-name-${Date.now()}`;

test.each([[true], [false]])(
  "successfully checks a feature flag is enabled=%s",
  async (expected) => {
    const { _fetch, client } = createMocks({}, { enabled: expected });

    const enabled = await client.isFeatureFlagEnabled(flagName);
    expect(enabled).toBe(expected);

    expect(_fetch).toHaveBeenCalledWith(
      `https://api.groundcontrol.sh/projects/${projectId}/flags/${flagName}/check?`,
      {
        headers: {
          authorization: `Bearer ${apiKey}`,
        },
        method: "GET",
      }
    );
  }
);

test("sends actor parameters when provided", async () => {
  const { _fetch, client } = createMocks();

  const enabled = await client.isFeatureFlagEnabled(flagName, {
    actors: ["actor1", "actor2"],
  });
  expect(enabled).toBe(true);

  expect(_fetch).toHaveBeenCalledWith(
    `https://api.groundcontrol.sh/projects/${projectId}/flags/${flagName}/check?actorIds=actor1&actorIds=actor2`,
    {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
    }
  );
});

test("sends cache parameter when provided", async () => {
  const { _fetch, client } = createMocks({ cache: 1000 });

  const enabled = await client.isFeatureFlagEnabled(flagName);
  expect(enabled).toBe(true);

  expect(_fetch).toHaveBeenCalledWith(
    `https://api.groundcontrol.sh/projects/${projectId}/flags/${flagName}/check?cache=1000`,
    {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
    }
  );
});

test("handles a non 200 response", async () => {
  const _fetch = vi.fn(() => {
    return {
      ok: false,
      json: async () => ({ message: "Something went wrong" }),
    };
  });

  const onError = vi.fn();

  const client = new GroundControlClient({
    apiKey,
    projectId,
    fetch: _fetch as unknown as typeof fetch,
    onError,
  });

  const enabled = await client.isFeatureFlagEnabled(flagName);
  expect(enabled).toBe(false);

  expect(_fetch).toHaveBeenCalledWith(
    `https://api.groundcontrol.sh/projects/${projectId}/flags/${flagName}/check?`,
    {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
    }
  );

  expect(onError).toHaveBeenCalledWith(new Error("Something went wrong"));
});

test("handles a response with an invalid body", async (expected) => {
  const _fetch = vi.fn(() => {
    return {
      ok: false,
      json: async () => ({ foo: "bar" }),
      statusText: "Generic HTTP error",
    };
  });

  const onError = vi.fn();

  const client = new GroundControlClient({
    apiKey,
    projectId,
    fetch: _fetch as unknown as typeof fetch,
    onError,
  });

  const enabled = await client.isFeatureFlagEnabled(flagName);
  expect(enabled).toBe(false);

  expect(_fetch).toHaveBeenCalledWith(
    `https://api.groundcontrol.sh/projects/${projectId}/flags/${flagName}/check?`,
    {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
    }
  );

  expect(onError).toHaveBeenCalledWith(new Error("Generic HTTP error"));
});

test.each([[true], [false]])(
  "handles a non JSON response. ok=%s",
  async (ok: boolean) => {
    const _fetch = vi.fn(() => {
      return {
        ok,
        json: async () => {
          throw new Error("Wrong");
        },
        statusText: "Generic HTTP error",
      };
    });

    const onError = vi.fn();

    const client = new GroundControlClient({
      apiKey,
      projectId,
      fetch: _fetch as unknown as typeof fetch,
      onError,
    });

    const enabled = await client.isFeatureFlagEnabled(flagName);
    expect(enabled).toBe(false);

    const url = `https://api.groundcontrol.sh/projects/${projectId}/flags/${flagName}/check?`;

    expect(_fetch).toHaveBeenCalledWith(url, {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
    });

    expect(onError).toHaveBeenCalledWith(
      new Error(
        ok ? `Failed to parse response from ${url}` : "Generic HTTP error"
      )
    );
  }
);

test("supports different overide strategies", async (expected) => {
  const _fetch = vi.fn(() => {
    return {
      ok: true,
      json: async () => ({ enabled: true }),
    };
  });

  const client = new GroundControlClient({
    apiKey,
    projectId,
    fetch: _fetch as unknown as typeof fetch,
  });

  // disable all flags
  client.disableAllFeatureFlags();
  expect(await client.isFeatureFlagEnabled(flagName)).toBe(false);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();

  // enable all flags
  client.enableAllFeatureFlags();
  expect(await client.isFeatureFlagEnabled(flagName)).toBe(true);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();

  // disable a flag for all actors
  client.disableFeatureFlag(flagName);
  expect(await client.isFeatureFlagEnabled(flagName)).toBe(false);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();

  // enable a flag for all actors
  client.enableFeatureFlag(flagName);
  expect(await client.isFeatureFlagEnabled(flagName)).toBe(true);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();

  // disable a flag for a specific actor
  client.disableFeatureFlag(flagName, { actors: ["user1"] });
  expect(
    await client.isFeatureFlagEnabled(flagName, { actors: ["user1"] })
  ).toBe(false);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();

  // enable a flag for a specific actor
  client.enableFeatureFlag(flagName, { actors: ["user1"] });
  expect(
    await client.isFeatureFlagEnabled(flagName, { actors: ["user1"] })
  ).toBe(true);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();

  // overrides at the flag level take precedence over full overrides
  client.disableAllFeatureFlags();
  client.enableFeatureFlag(flagName);
  expect(await client.isFeatureFlagEnabled(flagName)).toBe(true);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();

  // overrides at the actor level take precedence over other overrides
  client.disableAllFeatureFlags();
  client.disableFeatureFlag(flagName);
  client.enableFeatureFlag(flagName, { actors: ["user1"] });
  expect(
    await client.isFeatureFlagEnabled(flagName, { actors: ["user1"] })
  ).toBe(true);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();

  // actor overrides work for the same and different actors
  client.enableFeatureFlag(flagName, { actors: ["user1"] });
  client.disableFeatureFlag(flagName, { actors: ["user1"] });
  client.enableFeatureFlag(flagName, { actors: ["user2"] });
  expect(
    await client.isFeatureFlagEnabled(flagName, { actors: ["user1"] })
  ).toBe(false);
  expect(
    await client.isFeatureFlagEnabled(flagName, { actors: ["user2"] })
  ).toBe(true);
  expect(_fetch).not.toHaveBeenCalled();
  client.reset();
});

function createMocks(
  options?: Partial<GroundControlClientOptions>,
  response?: { enabled?: boolean }
) {
  const _fetch = vi.fn(() => {
    return {
      ok: true,
      json: async () => ({ enabled: response?.enabled ?? true }),
    };
  });

  const client = new GroundControlClient({
    ...options,
    apiKey,
    projectId,
    fetch: _fetch as unknown as typeof fetch,
  });

  return { client, _fetch };
}
