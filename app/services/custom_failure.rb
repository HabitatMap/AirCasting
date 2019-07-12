class CustomFailure < Devise::FailureApp
  def respond
    if http_auth?
      http_auth
    elsif request.content_type == nil
      # handles requst from mobile app
      self.status = 401
      self.content_type = 'application/json'
      self.response_body = { success: false, error: 'Unauthorized' }.to_json
    else
      # handles requests form web, eg admin panel
      redirect
    end
  end
end
