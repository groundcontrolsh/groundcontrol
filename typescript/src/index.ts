export class GroundControlClient {
  #fetch: typeof fetch;
  #baseURL: string;
  #projectId: string;
  #apiKey: string;

  constructor(options: {
    fetch?: typeof fetch;
    baseURL?: string;
    projectId: string;
    apiKey: string;
  }) {
    this.#fetch = options.fetch ?? global.fetch;
    this.#baseURL = options.baseURL || "https://api.groundcontrol.sh";
    this.#projectId = options.projectId;
    this.#apiKey = options.apiKey;
  }

  async isFeatureFlagEnabled(flagName: string, ...actorIds: string[]) {
    const query = actorIds.map((actorId) => `actorIds=${actorId}`).join("&");
    const path = `/projects/${
      this.#projectId
    }/flags/${flagName}/check?${query}`;
    const response = (await this.#request({
      method: "POST",
      path,
    })) as { enabled: boolean };

    return response.enabled;
  }

  async #request(options: { method: string; path: string }) {
    const url = `${this.#baseURL}${options.path}`;
    const response = await this.#fetch(url, {
      method: options.method,
      headers: {
        authorization: `Bearer ${this.#apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
    try {
      return (await response.json()) as unknown;
    } catch (err) {
      throw new Error(`Failed to parse response from ${url}`);
    }
  }
}

async function getErrorMessage(resp: Response): Promise<string> {
  const body = await resp.json().catch(() => null);
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    typeof body["message"] === "string"
  ) {
    return body["message"];
  }
  return resp.statusText;
}
