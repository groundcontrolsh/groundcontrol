package groundcontrol

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

const (
	DefaultBaseURL = "https://api.groundcontrol.sh"
)

type Client struct {
	baseURL    string
	projectID  string
	apiKey     string
	httpClient *http.Client

	// overrides
	actorOverrides map[string]map[string]bool
	flagOverrides  map[string]bool
	fullOverride   *bool
}

// New returns a new GroundControl client for a given project ID and API key.
func New(projectID, apiKey string, opts ...Option) *Client {
	c := &Client{
		baseURL:        DefaultBaseURL,
		projectID:      projectID,
		apiKey:         apiKey,
		httpClient:     http.DefaultClient,
		flagOverrides:  make(map[string]bool),
		actorOverrides: make(map[string]map[string]bool),
	}

	for _, opt := range opts {
		opt(c)
	}

	return c
}

// IsFeatureFlagEnabled returns whether or not the feature flag is enabled for the given entities.
// If no entities are provided, the feature flag is checked globally.
// If multiple entities are provided, it will return true if at least one is enabled.
func (c *Client) IsFeatureFlagEnabled(ctx context.Context, flagName string, entities ...Entity) (bool, error) {
	if len(entities) > 0 {
		actorOverride, ok := c.actorOverrides[flagName]
		if ok {
			for _, actor := range entities {
				value, ok := actorOverride[actor.Identifier()]
				if ok {
					return value, nil
				}
			}
		}
	}
	flagOverride, ok := c.flagOverrides[flagName]
	if ok {
		return flagOverride, nil
	}
	if c.fullOverride != nil {
		return *c.fullOverride, nil
	}

	reqURL, err := url.JoinPath(c.baseURL, "projects", c.projectID, "flags", flagName, "check")
	if err != nil {
		return false, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return false, err
	}

	query := req.URL.Query()
	for _, entity := range entities {
		query.Add(entity.Key(), entity.Identifier())
	}
	req.URL.RawQuery = query.Encode()

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return false, err
	}

	defer res.Body.Close()

	bs, err := io.ReadAll(res.Body)
	if err != nil {
		return false, err
	}

	if res.StatusCode != http.StatusOK {
		return false, fmt.Errorf("unexpected status code: %d, body: %s", res.StatusCode, string(bs))
	}

	var response = struct {
		Enabled bool `json:"enabled"`
	}{}

	err = json.Unmarshal(bs, &response)
	if err != nil {
		return false, err
	}

	return response.Enabled, nil
}

func (c *Client) DisableFeatureFlag(flagName string, entities ...Entity) {
	c.setFeatureFlagEnabled(false, flagName, entities...)
}

func (c *Client) DisableAllFeatureFlags() {
	value := false
	c.fullOverride = &value
}

func (c *Client) EnableFeatureFlag(flagName string, entities ...Entity) {
	c.setFeatureFlagEnabled(true, flagName, entities...)
}

func (c *Client) EnableAllFeatureFlags() {
	value := true
	c.fullOverride = &value
}

func (c *Client) Reset() {
	c.fullOverride = nil
	c.flagOverrides = make(map[string]bool)
	c.actorOverrides = make(map[string]map[string]bool)
}

func (c *Client) setFeatureFlagEnabled(enabled bool, flagName string, entities ...Entity) {
	if len(entities) == 0 {
		c.flagOverrides[flagName] = enabled
	} else {
		actors := c.actorOverrides[flagName]
		if actors == nil {
			actors = make(map[string]bool)
		}

		for _, entity := range entities {
			actors[entity.Identifier()] = enabled
		}
		c.actorOverrides[flagName] = actors
	}
}
