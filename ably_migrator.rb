#!/usr/bin/env ruby

require 'yaml'
require 'net/http'
require 'json'
require 'optparse'

class AblyAppMigrator
  ABLY_API_URL = 'https://control.ably.net/v1'

  def initialize(config_file)
    @config = YAML.load_file(config_file)
    @source_account_id = @config['source_account_id']
    @target_account_id = @config['target_account_id']
    @app_id = @config['app_id']
    @source_token = @config['source_token']
    @target_token = @config['target_token']
  end

  def migrate
    app_info = get_app_info
    new_app_id = create_app(app_info)
    migrate_keys(new_app_id)
    migrate_namespaces(new_app_id)
    migrate_queues(new_app_id)
    migrate_rules(new_app_id)
  end

  private

  def get_app_info
    puts "Getting app info"
    uri = URI("#{ABLY_API_URL}/accounts/#{@source_account_id}/apps/")
    puts uri
    response = send_request(uri, @source_token)
    puts response.body
    # Get only the information about the needed app
    apps = JSON.parse(response.body)
    apps.select { |app| app['id'] == @app_id }.first
  end

  def create_app(app_info)
    puts "Creating app"
    puts app_info
    app_info = app_info.reject { |k, v| ["id", "created", "modified", "accountId"].include? k }
    uri = URI("#{ABLY_API_URL}/accounts/#{@target_account_id}/apps")
    response = send_request(uri, @target_token, Net::HTTP::Post, app_info.to_json)
    puts response.body
    JSON.parse(response.body)['id']
  end

  def migrate_keys(new_app_id)
    puts "Migrating keys"
    uri = URI("#{ABLY_API_URL}/apps/#{@app_id}/keys")
    response = send_request(uri, @source_token)
    puts response.body
    keys = JSON.parse(response.body)
    
    keys.each do |key|
      puts "Migrating key #{key['id']}"
      key = key.reject { |k, v| ["id", "created", "modified", "accountId", "appId", "key", "status"].include? k }
      uri = URI("#{ABLY_API_URL}/apps/#{new_app_id}/keys")
      key_response = send_request(uri, @target_token, Net::HTTP::Post, key.to_json)
      puts key_response.body
    end
  end

  def migrate_namespaces(new_app_id)
    puts "Migrating namespaces"
    uri = URI("#{ABLY_API_URL}/apps/#{@app_id}/namespaces")
    response = send_request(uri, @source_token)
    puts response.body
    namespaces = JSON.parse(response.body)
    
    namespaces.each do |namespace|
      puts "Migrating namespace #{namespace['id']}"
      namespace = namespace.reject { |k, v| ["id", "created", "modified", "accountId"].include? k }
      uri = URI("#{ABLY_API_URL}/apps/#{new_app_id}/namespaces")
      namespace_response = send_request(uri, @target_token, Net::HTTP::Post, namespace.to_json)
      puts namespace_response.body
    end
  end

  def migrate_queues(new_app_id)
    puts "Migrating queues"
    uri = URI("#{ABLY_API_URL}/apps/#{@app_id}/queues")
    response = send_request(uri, @source_token)
    puts response.body
    queues = JSON.parse(response.body)
    
    queues.each do |queue|
      puts "Migrating queue #{queue['id']}"
      queue = queue.reject { |k, v| ["id", "created", "modified", "accountId"].include? k }
      uri = URI("#{ABLY_API_URL}/apps/#{new_app_id}/queues")
      queue_response = send_request(uri, @target_token, Net::HTTP::Post, queue.to_json)
      puts queue_response.body
    end
  end

  def migrate_rules(new_app_id)
    puts "Migrating rules"
    uri = URI("#{ABLY_API_URL}/apps/#{@app_id}/rules")
    response = send_request(uri, @source_token)
    puts response.body
    rules = JSON.parse(response.body)
    
    rules.each do |rule|
      puts "Migrating rule #{rule['id']}"
      rule = rule.reject { |k, v| ["id", "created", "modified", "accountId"].include? k }
      uri = URI("#{ABLY_API_URL}/apps/#{new_app_id}/rules")
      rule_response = send_request(uri, @target_token, Net::HTTP::Post, rule.to_json)
      puts rule_response.body
    end
  end

  def send_request(uri, token, http_method = Net::HTTP::Get, body = nil)
    puts "Sending request to #{uri}"
    puts "Body: #{body}" if body
    puts "HTTP Method: #{http_method}"
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    request = http_method.new(uri.request_uri)
    request['Authorization'] = "Bearer #{token}"
    request['Content-Type'] = 'application/json'
    request.body = body if body
    http.request(request)
  end
end

options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: ably_migrator.rb [options]"

  opts.on("-c", "--config FILE", "YAML config file") do |v|
    options[:config_file] = v
  end
end.parse!

if options[:config_file]
  migrator = AblyAppMigrator.new(options[:config_file])
  migrator.migrate
else
  puts "Please provide a config file with -c option"
end

