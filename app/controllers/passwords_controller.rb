class PasswordsController < Devise::PasswordsController
  skip_before_action :require_no_authentication
end
