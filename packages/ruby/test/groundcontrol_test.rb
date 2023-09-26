require_relative "../lib/groundcontrolsh"
require "test/unit"
require 'webmock'
include WebMock::API

WebMock.enable!

class TestGroundControl < Test::Unit::TestCase
  def setup
    @api_key = "gcp_#{Time.now.to_i}"
    @project_id = "P#{Time.now.to_i}"
    @flag_name = "flag-name-#{Time.now.to_i}"
  end

  def test_simple_enabled
    stub_request(:get, "https://api.groundcontrol.sh/projects/#{@project_id}/flags/#{@flag_name}/check").
    with(
      headers: {
          'Authorization'=>"Bearer #{@api_key}",
      }).
    to_return(status: 200, body: { enabled: true }.to_json, headers: {})

    client = GroundControl.new(
      project_id: @project_id,
      api_key: @api_key,
    )

    enabled = client.feature_flag_enabled?(@flag_name)
    assert_equal(true, enabled)
  end

  def test_simple_disabled
    stub_request(:get, "https://api.groundcontrol.sh/projects/#{@project_id}/flags/#{@flag_name}/check").
    with(
      headers: {
          'Authorization'=>"Bearer #{@api_key}",
      }).
    to_return(status: 200, body: { enabled: false }.to_json, headers: {})

    client = GroundControl.new(
      project_id: @project_id,
      api_key: @api_key,
    )

    enabled = client.feature_flag_enabled?(@flag_name)
    assert_equal(false, enabled)
  end

  def test_with_ttl_cache_fail
    stub_request(:get, "https://api.groundcontrol.sh/projects/#{@project_id}/flags/#{@flag_name}/check").
    with(
      headers: {
          'Authorization'=>"Bearer #{@api_key}",
      }).
    to_return(status: 200, body: { enabled: true }.to_json, headers: {})

    client = GroundControl.new(
      project_id: @project_id,
      api_key: @api_key,
      cache: -1, # forces all cached values to always expire
    )

    enabled = client.feature_flag_enabled?(@flag_name)
    assert_equal(true, enabled)

    # Stub an enabled: false request
    stub_request(:get, "https://api.groundcontrol.sh/projects/#{@project_id}/flags/#{@flag_name}/check").
    with(
      headers: {
          'Authorization'=>"Bearer #{@api_key}",
      }).
    to_return(status: 200, body: { enabled: false }.to_json, headers: {})

    # The returned value is fresh because the cached value has expired
    enabled = client.feature_flag_enabled?(@flag_name)
    assert_equal(false, enabled)
  end

  def test_with_ttl
    stub_request(:get, "https://api.groundcontrol.sh/projects/#{@project_id}/flags/#{@flag_name}/check").
    with(
      headers: {
          'Authorization'=>"Bearer #{@api_key}",
      }).
    to_return(status: 200, body: { enabled: true }.to_json, headers: {})

    client = GroundControl.new(
      project_id: @project_id,
      api_key: @api_key,
      cache: 60,
    )

    enabled = client.feature_flag_enabled?(@flag_name)
    assert_equal(true, enabled)

    WebMock.reset!
    WebMock.disable_net_connect!(allow_localhost: true)

    # The returned value is still true because it's been cached
    enabled = client.feature_flag_enabled?(@flag_name)
    assert_equal(true, enabled)
    assert_not_requested(:any, "https://api.groundcontrol.sh")
  end

  def test_overrides
    WebMock.disable_net_connect!(allow_localhost: true)

    client = GroundControl.new(
      project_id: @project_id,
      api_key: @api_key,
    )

    client.disable_all_feature_flags
    assert_equal(false, client.feature_flag_enabled?(@flag_name))
    client.reset

    # enable all flags
    client.enable_all_feature_flags
    assert_equal(true, client.feature_flag_enabled?(@flag_name))
    client.reset

    # disable a flag for all actors
    client.disable_feature_flag(@flag_name)
    assert_equal(false, client.feature_flag_enabled?(@flag_name))
    client.reset

    # enable a flag for all actors
    client.enable_feature_flag(@flag_name)
    assert_equal(true, client.feature_flag_enabled?(@flag_name))
    client.reset

    # disable a flag for a specific actor
    client.disable_feature_flag(@flag_name, { actors: ["user1"] })
    assert_equal(false,
      client.feature_flag_enabled?(@flag_name, { actors: ["user1"] })
    )
    client.reset

    # enable a flag for a specific actor
    client.enable_feature_flag(@flag_name, { actors: ["user1"] })
    assert_equal(true,
      client.feature_flag_enabled?(@flag_name, { actors: ["user1"] })
    )
    client.reset

    # overrides at the flag level take precedence over full overrides
    client.disable_all_feature_flags
    client.enable_feature_flag(@flag_name)
    assert_equal(true, client.feature_flag_enabled?(@flag_name))
    client.reset

    # overrides at the actor level take precedence over other overrides
    client.disable_all_feature_flags
    client.disable_feature_flag(@flag_name)
    client.enable_feature_flag(@flag_name, { actors: ["user1"] })
    assert_equal(true,
      client.feature_flag_enabled?(@flag_name, { actors: ["user1"] })
    )
    client.reset

    # actor overrides work for the same and different actors
    client.enable_feature_flag(@flag_name, { actors: ["user1"] })
    client.disable_feature_flag(@flag_name, { actors: ["user1"] })
    client.enable_feature_flag(@flag_name, { actors: ["user2"] })
    assert_equal(false,
      client.feature_flag_enabled?(@flag_name, { actors: ["user1"] })
    )
    assert_equal(true,
      client.feature_flag_enabled?(@flag_name, { actors: ["user2"] })
    )
    client.reset
  end

end
