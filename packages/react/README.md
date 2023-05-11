![GroundControl](https://github.com/groundcontrolsh/groundcontrol/raw/main/images/hero.png)

# GroundControl

TypeScript SDK for [GroundControl](https://groundcontrol.sh/).

## Installing

With NPM

```shell
npm i @groundcontrolsh/react
```

With yarn

```shell
yarn add @groundcontrolsh/react
```

## Usage

```tsx
import { GroundControlProvider, useFeatureFlag } from "@groundcontrolsh/react";

// In your top-most component tree
function App() {
  return (
    <GroundControlProvider projectId="YOUR_PROJECT_ID" apiKey="YOUR_API_KEY">
      ...
    </GroundControlProvider>
  );
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
