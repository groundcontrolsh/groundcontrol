require File.expand_path('../lib/version', __FILE__)

Gem::Specification.new do |s|
  s.name        = "groundcontrolsh"
  s.version     = GroundControl::VERSION
  s.summary     = "Ruby SDK for groundcontrol.sh"
  s.description = "Verify the rollout status of feature flags created in your groundcontrol.sh project"
  s.authors     = ["Alberto Gimeno"]
  s.email       = "gimenete@groundcontrol.sh"
  s.files       = ["lib/groundcontrolsh.rb"]
  s.homepage    = "https://groundcontrol.sh"
  s.license     = "MIT"
end
