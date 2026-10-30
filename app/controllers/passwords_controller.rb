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

  # Both hooks below are HTML-only. For `*.json` — which is the mobile
  # forgot-password endpoint, `POST /users/password.json` — `super` keeps the
  # Location header byte-identical. iOS, Android and KMP all discard the
  # response body and the header and read only the status, so this changes
  # nothing for them either way; the gate makes that true by construction
  # rather than by their current implementation.
  def create
    stash_reset_email if request.format.html?
    super
  end

  # "Check your email" (Figma frame 06). Reached only by the redirect from
  # `create`, which is what leaves the address in the session; a direct visit
  # has nothing to resend to and nothing to say, so it goes to the form.
  def sent
    @reset_email = session[:reset_password_email]
    return redirect_to new_password_path(resource_name) if @reset_email.blank?

    # The page is the message. Leaving Devise's notice set would say the same
    # thing twice, once in an alert the design does not draw.
    flash.delete(:notice)
  end

  # "Password updated" (Figma frame 09). The flag is set by
  # `after_resetting_password_path_for` and consumed here, so this screen can
  # only be seen by someone who just changed their password — reloading it, or
  # arriving with a bookmark, goes to the map.
  def updated
    return redirect_to root_path unless session.delete(:password_reset_done)

    flash.delete(:notice)
  end

  protected

  def after_sending_reset_password_instructions_path_for(resource_name)
    request.format.html? ? password_sent_path : super
  end

  # Devise calls this only on a successful reset.
  def after_resetting_password_path_for(resource)
    return super unless request.format.html?

    session[:password_reset_done] = true
    password_updated_path
  end

  private

  # Both keys, in the same order `User.find_for_database_authentication` reads
  # them: the mobile apps send `login`, the web form sends `email`, and
  # `resource_params` is unsanitised in `Devise::PasswordsController`, so either
  # arrives intact.
  #
  # This is the user's own input going back into the user's own session.
  # `User.send_reset_password_instructions` answers identically for a login that
  # matches nothing, so holding it here tells an attacker nothing they did not
  # already have.
  def stash_reset_email
    session[:reset_password_email] =
      resource_params[:login].presence || resource_params[:email].presence
  end
end
