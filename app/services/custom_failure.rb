class CustomFailure < Devise::FailureApp
  API_CONTENT_TYPES = [nil, 'application/json', 'application/octet-stream'].freeze

  def respond
    if http_auth? || api_request?
      self.status = 401
      self.content_type = 'application/json'
      self.response_body = { success: false, error: 'Unauthorized' }.to_json
    else
      redirect
    end
  end

  private

  def api_request?
    API_CONTENT_TYPES.include?(request.media_type)
  end
end
