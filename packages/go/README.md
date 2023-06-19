![GroundControl](https://github.com/groundcontrolsh/groundcontrol/raw/main/images/hero.png)

# GroundControl

Go SDK for [GroundControl](https://groundcontrol.sh/).

## Setup

```
go get github.com/groundcontrolsh/groundcontrol/packages/go
```

## Usage

```go
client := groundcontrol.New("YOUR_PROJECT_ID", "YOUR_API_KEY")

// check globally enabled
client.IsFeatureFlagEnabled(ctx, "flag-name")

// check enablement for single actor
client.IsFeatureFlagEnabled(ctx, "flag-name", groundcontrol.Actor("alice"))

// or multiple actors
client.IsFeatureFlagEnabled(ctx, "flag-name", groundcontrol.Actor("alice"), groundcontrol.Actor("bob"))
```

### Options

#### `WithBaseURL`

Sets the base URL of the client:

```go
client := groundcontrol.New("YOUR_PROJECT_ID", "YOUR_API_KEY", groundcontrol.WithBaseURL("http://localhost:8080"))
```

#### `WithHTTPClient`

Sets the underlying `net/http.Client`:

```go
// e.g. hashicorp/go-retryablehttp
retryClient := retryablehttp.NewClient().StandardClient()

client := groundcontrol.New("YOUR_PROJECT_ID", "YOUR_API_KEY", groundcontrol.WithHTTPClient(retryClient))
```
