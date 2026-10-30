class PasswordsController < Devise::PasswordsController
  skip_before_action :require_no_authentication

  # Devise does not look at the token on GET — `edit` renders the form for any
  # string at all, and the token is only checked on PUT, inside
  # `reset_password_by_token`. So a link that died hours ago still renders a
  # working-looking form, and the user learns it is dead only after choosing a
  # password and typing it twice. On a phone, which is where most of these links
  # are opened, that is the whole interaction wasted.
  #
  # Checking here costs one indexed lookup and moves the bad news to the top of
  # the screen, with the form that fixes it. The PUT-side check stays exactly as
  # it was: it still catches a token that expires between this GET and the
  # submit, and `devise/shared/error_summary` still surfaces that.
  def edit
    user =
      resource_class.with_reset_password_token(
        params[:reset_password_token].to_s,
      )
    return super if user&.reset_password_period_valid?

    self.resource = resource_class.new
    # 200, not 410: this is a page the user can act on, not a dead resource —
    # it carries the form that sends them a fresh link.
    render :expired
  end
end
