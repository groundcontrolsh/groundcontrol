![GroundControl](https://github.com/groundcontrolsh/groundcontrol/raw/main/images/hero.png)

# GroundControl

Ruby SDK for [GroundControl](https://groundcontrol.sh/).

## Installing

```shell
gem install groundcontrolsh
```

## Usage

```ruby
require "groundcontrolsh"

client = GroundControl.new(
  project_id: "YOUR_PROJECT_ID",
  api_key: "YOUR_API_KEY"
)

enabled = client.feature_flag_enabled?("csv-export") # You can pass a symbol or a string
```
