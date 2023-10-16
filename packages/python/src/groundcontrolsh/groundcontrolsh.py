import requests
import time
from urllib.parse import quote
import typing as t

class GroundControl:

    def __init__(self, project_id: str, api_key: str, **options: t.Any) -> None:
        self.project_id: str = project_id
        self.api_key: str = api_key
        self.base_url: str = options.get('base_url', 'https://api.groundcontrol.sh')
        self.ttl: int | None = options.get('cache')
        self.cache: t.Dict[str, t.Dict[str, t.Any]] = {}

        self.actor_overrides: t.Dict[str, t.Dict[str, bool]] = {}
        self.flag_overrides: t.Dict[str, bool] = {}
        self.full_override: bool | None = None

    def is_feature_flag_enabled(self, flag_name: str, options: t.Dict[str, t.Any] | None = None) -> bool:
        options = options or {}
        actors = options.get('actors', [])

        actor_overrides = self.actor_overrides.get(flag_name, {})
        for actor_id in actors:
            override = actor_overrides.get(actor_id)
            if override is not None:
                return override

        flag_override = self.flag_overrides.get(flag_name)
        if flag_override is not None:
            return flag_override

        if self.full_override is not None:
            return self.full_override

        query = "&".join(f"actorIds={quote(actor)}" for actor in actors)
        url = f"{self.base_url}/projects/{self.project_id}/flags/{flag_name}/check?{query}"
        cached = self.cache.get(url)

        if cached:
            if cached['expires'] < int(time.time()):
                self.cache.pop(url)
            else:
                return cached['enabled']

        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            # TODO: use on_error callback
            return False

        body = response.json()
        enabled = body["enabled"]

        if self.ttl:
            self.cache[url] = {
                "expires": int(time.time()) + self.ttl,
                "enabled": enabled
            }

        return enabled

    def disable_feature_flag(self, flag_name: str, options: t.Dict[str, t.Any] | None = None) -> None:
        self.set_feature_flag_enabled(False, flag_name, options)

    def disable_all_feature_flags(self) -> None:
        self.full_override = False

    def enable_feature_flag(self, flag_name: str, options: t.Dict[str, t.Any] | None = None) -> None:
        self.set_feature_flag_enabled(True, flag_name, options)

    def enable_all_feature_flags(self) -> None:
        self.full_override = True

    def reset(self) -> None:
        self.actor_overrides.clear()
        self.flag_overrides.clear()
        self.full_override = None

    def set_feature_flag_enabled(self, enabled, flag_name: str, options: t.Dict[str, t.Any] | None = None) -> None:
        options = options or {}
        actors_ops = options.get('actors')

        if actors_ops is None:
            self.flag_overrides[flag_name] = enabled
        else:
            actors = self.actor_overrides.get(flag_name, {})
            for actor_id in actors_ops:
                actors[actor_id] = enabled
            self.actor_overrides[flag_name] = actors
