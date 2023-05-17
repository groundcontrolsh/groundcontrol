require 'uri'
require 'net/http'
require 'openssl'
require 'json'
require 'cgi'

class GroundControl
  def initialize(project_id:, api_key:, **options)
    @project_id = project_id
    @api_key = api_key
    @base_url = options[:base_url] || 'https://api.groundcontrol.sh'
    # @cache = options[:cache] || nil
  end

  def feature_flag_enabled?(feature_name, options = {})
    actors = options[:actors] || []

    query = actors.map { |actor| "actorIds=#{CGI.escape(actor)}" }
    # query << "cache=#{@cache}" if @cache

    url = URI("#{@base_url}/projects/#{@project_id}/flags/#{feature_name}/check?#{query.join('&')}")
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true

    request = Net::HTTP::Get.new(url)
    request["Authorization"] = "Bearer #{@api_key}"
    response = http.request(request)

    return nil if response.code != '200'

    body = JSON.parse(response.body)

    return body["enabled"]
  end
end
