import requests
import json
import time
from urllib.parse import quote

class GroundControl:
    def __init__(self, project_id, api_key, **options):
        self.project_id = project_id
        self.api_key = api_key
        self.base_url = options.get('base_url', 'https://api.groundcontrol.sh')
        self.ttl = options.get('cache')
        self.cache = {}

        self.actor_overrides = {}
        self.flag_overrides = {}
        self.full_override = None

    def feature_flag_enabled(self, flag_name, options=None):
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
            self.cache[url] = {"expires": int(time.time()) + self.ttl, "enabled": enabled}

        return enabled

    def disable_feature_flag(self, flag_name, options=None):
        self.set_feature_flag_enabled(False, flag_name, options)

    def disable_all_feature_flags(self):
        self.full_override = False

    def enable_feature_flag(self, flag_name, options=None):
        self.set_feature_flag_enabled(True, flag_name, options)

    def enable_all_feature_flags(self):
        self.full_override = True

    def reset(self):
        self.actor_overrides.clear()
        self.flag_overrides.clear()
        self.full_override = None

    def set_feature_flag_enabled(self, enabled, flag_name, options=None):
        options = options or {}
        actors_ops = options.get('actors')

        if actors_ops is None:
            self.flag_overrides[flag_name] = enabled
        else:
            actors = self.actor_overrides.get(flag_name, {})
            for actor_id in actors_ops:
                actors[actor_id] = enabled
            self.actor_overrides[flag_name] = actors
