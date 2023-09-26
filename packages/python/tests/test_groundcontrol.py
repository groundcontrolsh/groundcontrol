import unittest
from unittest.mock import patch
import json
import requests
import time
from src.groundcontrol import GroundControl

class TestGroundControl(unittest.TestCase):
    def setUp(self):
        self.api_key = f"gcp_{int(time.time())}"
        self.project_id = f"P{int(time.time())}"
        self.flag_name = f"flag-name-{int(time.time())}"

    @patch('requests.get')
    def test_simple_enabled(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json = lambda : { "enabled": True }

        client = GroundControl(
            project_id=self.project_id,
            api_key=self.api_key
        )

        enabled = client.feature_flag_enabled(self.flag_name)
        self.assertEqual(True, enabled)

        mock_get.assert_called_once_with(f"https://api.groundcontrol.sh/projects/{self.project_id}/flags/{self.flag_name}/check?", headers={"Authorization": f"Bearer {self.api_key}"})

    @patch('requests.get')
    def test_simple_disabled(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json = lambda : { "enabled": False }

        client = GroundControl(
            project_id=self.project_id,
            api_key=self.api_key
        )

        enabled = client.feature_flag_enabled(self.flag_name)
        self.assertEqual(False, enabled)

        mock_get.assert_called_once_with(f"https://api.groundcontrol.sh/projects/{self.project_id}/flags/{self.flag_name}/check?", headers={"Authorization": f"Bearer {self.api_key}"})

    @patch('requests.get')
    def test_with_ttl_cache_fail(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json = lambda : { "enabled": True }

        client = GroundControl(
            project_id=self.project_id,
            api_key=self.api_key,
            cache=-1, # forces all cached values to always expire
        )

        enabled = client.feature_flag_enabled(self.flag_name)
        self.assertEqual(True, enabled)
        mock_get.assert_called_with(f"https://api.groundcontrol.sh/projects/{self.project_id}/flags/{self.flag_name}/check?", headers={"Authorization": f"Bearer {self.api_key}"})


        mock_get.return_value.json = lambda : { "enabled": False }
        enabled = client.feature_flag_enabled(self.flag_name)
        # The returned value is fresh because the cached value has expired
        self.assertEqual(False, enabled)
        mock_get.assert_called_with(f"https://api.groundcontrol.sh/projects/{self.project_id}/flags/{self.flag_name}/check?", headers={"Authorization": f"Bearer {self.api_key}"})

    @patch('requests.get')
    def test_with_ttl(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json = lambda : { "enabled": True }

        client = GroundControl(
            project_id=self.project_id,
            api_key=self.api_key,
            cache=60,
        )

        enabled = client.feature_flag_enabled(self.flag_name)
        self.assertEqual(True, enabled)
        mock_get.assert_called_with(f"https://api.groundcontrol.sh/projects/{self.project_id}/flags/{self.flag_name}/check?", headers={"Authorization": f"Bearer {self.api_key}"})


        mock_get.return_value.json = lambda : { "enabled": False }
        enabled = client.feature_flag_enabled(self.flag_name)
        # The returned value is still true because it's been cached
        self.assertEqual(True, enabled)

    def test_overrides(self):
      client = GroundControl(
          project_id=self.project_id,
          api_key=self.api_key
      )

      client.disable_all_feature_flags()
      self.assertEqual(False, client.feature_flag_enabled(self.flag_name))
      client.reset()

      # enable all flags
      client.enable_all_feature_flags()
      self.assertEqual(True, client.feature_flag_enabled(self.flag_name))
      client.reset()

      # disable a flag for all actors
      client.disable_feature_flag(self.flag_name)
      self.assertEqual(False, client.feature_flag_enabled(self.flag_name))
      client.reset()

      # enable a flag for all actors
      client.enable_feature_flag(self.flag_name)
      self.assertEqual(True, client.feature_flag_enabled(self.flag_name))
      client.reset()

      # disable a flag for a specific actor
      client.disable_feature_flag(self.flag_name, { "actors": ["user1"] })
      self.assertEqual(False,
        client.feature_flag_enabled(self.flag_name, { "actors": ["user1"] })
      )
      client.reset()

      # enable a flag for a specific actor
      client.enable_feature_flag(self.flag_name, { "actors": ["user1"] })
      self.assertEqual(True,
        client.feature_flag_enabled(self.flag_name, { "actors": ["user1"] })
      )
      client.reset()

      # overrides at the flag level take precedence over full overrides
      client.disable_all_feature_flags()
      client.enable_feature_flag(self.flag_name)
      self.assertEqual(True, client.feature_flag_enabled(self.flag_name))
      client.reset()

      # overrides at the actor level take precedence over other overrides
      client.disable_all_feature_flags()
      client.disable_feature_flag(self.flag_name)
      client.enable_feature_flag(self.flag_name, { "actors": ["user1"] })
      self.assertEqual(True,
        client.feature_flag_enabled(self.flag_name, { "actors": ["user1"] })
      )
      client.reset()

      # actor overrides work for the same and different actors
      client.enable_feature_flag(self.flag_name, { "actors": ["user1"] })
      client.disable_feature_flag(self.flag_name, { "actors": ["user1"] })
      client.enable_feature_flag(self.flag_name, { "actors": ["user2"] })
      self.assertEqual(False,
        client.feature_flag_enabled(self.flag_name, { "actors": ["user1"] })
      )
      self.assertEqual(True,
        client.feature_flag_enabled(self.flag_name, { "actors": ["user2"] })
      )
      client.reset()

if __name__ == '__main__':
    unittest.main()
