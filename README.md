# GroundControl

This is the repository for the TypeScript SDK for [GroundControl](https://groundcontrol.sh/). More SDKs will be available in the future.

## Installing

With NPM

```shell
npm i @groundcontrol/groundcontrol
```

With yarn

```shell
yarn add @groundcontrol/groundcontrol
```

## Usage

```ts
import { GroundControlClient } from "@groundcontrolsh/groundcontrol";

const client = new GroundControlClient({
  apiKey: "YOUR_API_KEY",
  projectId: "YOUR_PROJECT_ID",
});

const isEnabled = await client.isFeatureFlagEnabled("flag-name");
const isEnabledForActor = await client.isFeatureFlagEnabled(
  "flag-name",
  "actor1234"
);
```
