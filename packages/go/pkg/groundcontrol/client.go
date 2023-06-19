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
}

// New returns a new GroundControl client for a given project ID and API key.
func New(projectID, apiKey string, opts ...Option) *Client {
	c := &Client{
		baseURL:    DefaultBaseURL,
		projectID:  projectID,
		apiKey:     apiKey,
		httpClient: http.DefaultClient,
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
	reqURL, err := url.JoinPath(c.baseURL, "projects", c.projectID, "flags", flagName, "check")
	if err != nil {
		return false, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, nil)
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
