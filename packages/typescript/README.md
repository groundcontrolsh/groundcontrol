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
  apiKey: "YOUR_API_KEY",
  projectId: "YOUR_PROJECT_ID",
});

const isEnabled = await client.isFeatureFlagEnabled("flag-name");
const isEnabledForActor = await client.isFeatureFlagEnabled(
  "flag-name",
  "actor1234"
);
```
