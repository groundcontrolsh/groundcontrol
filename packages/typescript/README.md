![GroundControl](https://github.com/groundcontrolsh/groundcontrol/raw/main/images/hero.png)

# GroundControl

TypeScript SDK for [GroundControl](https://groundcontrol.sh/).

## Installing

With NPM

```shell
npm i @groundcontrolsh/groundcontrol
```

With yarn

```shell
yarn add @groundcontrolsh/groundcontrol
```

## Usage

```ts
import { GroundControlClient } from "@groundcontrolsh/groundcontrol";

const client = new GroundControlClient({
  projectId: "YOUR_PROJECT_ID",
  apiKey: "YOUR_API_KEY",
  cache: 60, // Optional. For how long results are cached in seconds. Defaults to not caching.
  // fetch: ... Pass a fetch implementation if there's not a global one defined.
});

const isEnabled = await client.isFeatureFlagEnabled("flag-name");
const isEnabledForActor = await client.isFeatureFlagEnabled("flag-name", {
  actors: ["actor1234"],
});
```
