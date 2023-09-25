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
    @ttl = options[:cache] || nil
    @cache = {}

    @_actor_overrides = {}
    @_flag_overrides = {}
    @full_override = nil
  end

  def feature_flag_enabled?(flag_name, options = {})
    actors = options[:actors] || []

    actor_overrides = @_actor_overrides[flag_name]
    actors.each do |actor_id|
      override = actor_overrides[actor_id]
      return override if override != nil
    end if actor_overrides != nil && actors != nil

    flag_override = @_flag_overrides[flag_name]
    return flag_override if flag_override != nil
    return @_full_override if @_full_override != nil

    query = actors.map { |actor| "actorIds=#{CGI.escape(actor)}" }
    url = URI("#{@base_url}/projects/#{@project_id}/flags/#{flag_name}/check?#{query.join('&')}")
    cached = @cache[url]
    if cached
      if cached[:expires] < Time.now.to_i
        @cache.delete(url)
      else
        return cached[:enabled]
      end
    end

    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true

    request = Net::HTTP::Get.new(url)
    request["Authorization"] = "Bearer #{@api_key}"
    response = http.request(request)

    return nil if response.code != '200'

    body = JSON.parse(response.body)
    enabled = body["enabled"]

    if @ttl
      @cache[url] = { expires: Time.now.to_i + @ttl, enabled: enabled }
    end

    return enabled
  end

  def disable_feature_flag(flag_name, options = nil)
    set_feature_flag_enabled(false, flag_name, options)
  end

  def disable_all_feature_flags
    @_full_override = false
  end

  def enable_feature_flag(flag_name, options = nil)
    set_feature_flag_enabled(true, flag_name, options)
  end

  def enable_all_feature_flags()
    @_full_override = true
  end

  def reset
    @_actor_overrides.clear
    @_flag_overrides.clear
    @_full_override = nil
  end

  private

  def set_feature_flag_enabled(enabled, flag_name, options)
    options = {} if options == nil
    actors_ops = options[:actors]
    if actors_ops == nil
      @_flag_overrides[flag_name] = enabled
    else
      actors = @_actor_overrides[flag_name] || {}
      actors_ops.each do |actor_id|
        actors[actor_id] = enabled
      end
      @_actor_overrides[flag_name] = actors
    end
  end
end
