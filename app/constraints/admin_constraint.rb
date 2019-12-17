class AdminConstraint
  def matches?(request)
    request.env['warden'].authenticate? && request.env['warden'].user.admin?
  end
end
