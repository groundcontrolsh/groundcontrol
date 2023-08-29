require_relative "../lib/groundcontrolsh"
require "test/unit"
require 'webmock'
include WebMock::API

WebMock.enable!

class TestGroundControl < Test::Unit::TestCase
  @api_key = "gcp_#{Time.now.to_i}"
  @project_id = "P#{Time.now.to_i}"
  @flag_name = "flag-name-#{Time.now.to_i}"

  def test_simple
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

end
