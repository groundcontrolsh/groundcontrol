![GroundControl](https://github.com/groundcontrolsh/groundcontrol/raw/main/images/hero.png)

# GroundControl

React SDK for [GroundControl](https://groundcontrol.sh/).

## Installing

With NPM

```shell
npm i @groundcontrolsh/groundcontrol @groundcontrolsh/react
```

With yarn

```shell
yarn add @groundcontrolsh/groundcontrol @groundcontrolsh/react
```

## Usage

```tsx
import { GroundControlClient } from "@groundcontrolsh/groundcontrol";
import { GroundControlProvider, useFeatureFlag } from "@groundcontrolsh/react";

// In your top-most component tree
const client = new GroundControlClient({
  projectId: "YOUR_PROJECT_ID",
  apiKey: "YOUR_API_KEY",
  cache: 60, // Optional. For how long results are cached in seconds. Defaults to not caching.
});

function App() {
  // The cache prop defines for how long results are cached in seconds. Defaults to not caching.
  return <GroundControlProvider client={client}>...</GroundControlProvider>;
}

// In your components
function MyComponent() {
  const isEnabled = useFeatureFlag("flag-name");
  const isEnabledForActor = useFeatureFlag("flag-name", {
    actors: ["actor1234"],
  });

  // ...
}
```
