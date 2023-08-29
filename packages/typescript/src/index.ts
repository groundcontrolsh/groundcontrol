// Main file
export type GroundControlClientOptions = {
  fetch?: typeof fetch;
  baseURL?: string;
  cache?: number;
  onError?: (err: Error) => void;
  projectId: string;
  apiKey: string;
};

export class GroundControlClient {
  #fetch: typeof fetch;
  #baseURL: string;
  #projectId: string;
  #apiKey: string;
  #cache?: number;
  #onError: (err: Error) => void;

  constructor(options: GroundControlClientOptions) {
    this.#fetch = options.fetch ?? global.fetch;
    this.#baseURL = options.baseURL || "https://api.groundcontrol.sh";
    this.#projectId = options.projectId;
    this.#apiKey = options.apiKey;
    this.#cache = options.cache;
    this.#onError = options.onError ?? defaultOnError;
  }

  async isFeatureFlagEnabled(
    flagName: string,
    options?: { actors?: string[] }
  ) {
    const query = (options?.actors || [])
      .map((actorId) => `actorIds=${encodeURIComponent(actorId)}`)
      .concat(this.#cache ? [`cache=${this.#cache}`] : [])
      .join("&");
    const path = `/projects/${
      this.#projectId
    }/flags/${flagName}/check?${query}`;
    const response = (await this.#request({
      method: "GET",
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
      this.#onError(new Error(await getErrorMessage(response)));
      return { enabled: false };
    }
    try {
      return (await response.json()) as unknown;
    } catch (err) {
      this.#onError(new Error(`Failed to parse response from ${url}`));
      return { enabled: false };
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

function defaultOnError(error: Error) {
  console.error(error);
}
