package groundcontrol

// Entity is an interface that represents an entity that a feature flag can be enabled for.
type Entity interface {
	// Key returns the query parameter name for the entity.
	Key() string
	// Identifier returns the ID representing the entity.
	Identifier() string
}

// Actor is an entity that represents an feature-flaggable actor.
type Actor string

func (a Actor) Key() string {
	return "actorIds"
}

func (a Actor) Identifier() string {
	return string(a)
}
