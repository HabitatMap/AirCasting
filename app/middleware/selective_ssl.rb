class SelectiveSsl
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)

    # Allow HTTP for API endpoints and firmware communication
    if request.path.start_with?('/api/') || request.head?
      env['HTTPS'] = 'off'
      env['rack.url_scheme'] = 'http'
      env['HTTP_X_FORWARDED_PROTO'] = 'http'
    end

    @app.call(env)
  end
end
