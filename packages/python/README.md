![GroundControl](https://github.com/groundcontrolsh/groundcontrol/raw/main/images/hero.png)

# GroundControl

Python SDK for [GroundControl](https://groundcontrol.sh/).

## Installing

```shell
pip install groundcontrolsh
```

## Usage

```python
from groundcontrolsh import GroundControl

client = GroundControl(
  project_id="YOUR_PROJECT_ID",
  api_key="YOUR_API_KEY",
  cache=60) # Optional cache ttl in seconds

enabled = client.is_feature_flag_enabled("csv-export")
```
