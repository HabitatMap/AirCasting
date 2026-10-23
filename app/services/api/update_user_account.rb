# Backs `PATCH /api/user` — the three account-settings bottom sheets (change
# email, change username, change password) all post here with whichever subset
# of fields they own.
#
# Errors come back as the `ActiveModel::Errors` object itself, not its
# `to_hash`. `to_hash` keeps only the English sentence and drops `type` — the
# machine code the client actually needs — so the controller is handed the
# object and `ValidationErrorsSerializer` reads the type off it.
class Api::UpdateUserAccount
  # Everything a client may send. Deliberately *not* the controller's existing
  # `user_params`, which is `permit!`: `authentication_token` is burned into
  # AirBeam EEPROM with no refresh path, so letting a request rewrite it would
  # silently stop every one of that user's devices uploading. `admin` is the
  # other column that must never arrive from outside.
  PERMITTED = %i[username email password password_confirmation].freeze

  def initialize(user:, params:)
    @user = user
    @params = params
  end

  def call
    return Failure.new(no_attributes_error) if attributes.empty?

    if changing_password? && password_change_errors.any?
      # `assign_attributes` + `valid?` so the response carries every problem at
      # once — a too-short new password and a wrong current one are reported
      # together rather than one request apart.
      user.assign_attributes(attributes)
      user.valid?
      password_change_errors.each { |field, type| user.errors.add(field, type) }
      return Failure.new(user.errors)
    end

    if user.update(attributes)
      Success.new(user)
    else
      Failure.new(user.errors)
    end
  ensure
    user.clean_up_passwords
  end

  private

  attr_reader :user, :params

  # A sheet the user opened but did not type into sends `""`, not a missing
  # key. Treating that as a value would fail `validates :username, presence`
  # and, for `password`, flip devise's `password_required?` on so an untouched
  # password field alone would 422 the whole request.
  def attributes
    @attributes ||=
      permitted_params
        .slice(*PERMITTED)
        .reject { |_, value| value.blank? }
  end

  # The controller permits as well; slicing again here means the guarantee
  # holds for any other caller too, rather than living in one before_action.
  def permitted_params
    @permitted_params ||= params.to_h.symbolize_keys
  end

  def changing_password?
    attributes.key?(:password)
  end

  def current_password
    permitted_params[:current_password]
  end

  def current_password_valid?
    current_password.present? && user.valid_password?(current_password)
  end

  def password_confirmation
    permitted_params[:password_confirmation]
  end

  # The two gates on a password change: proof the caller knows the password in
  # force, and a confirmation so a typo cannot lock them out of the account.
  # Devise's `validates_confirmation_of` only fires when a confirmation is
  # *present*, so "sent none at all" has to be caught here.
  def password_change_errors
    @password_change_errors ||=
      [].tap do |errors|
        errors << [:current_password, current_password.blank? ? :blank : :invalid] unless current_password_valid?
        errors << [:password_confirmation, :blank] if password_confirmation.blank?
      end
  end

  # `:base` needs a type of its own because ActiveModel has no stock one for
  # "you sent nothing to change" — unlike every other failure here, which uses
  # the type ActiveModel already assigns. Adding it to `user.errors` rather
  # than returning a bare hash keeps every failure path answering one object.
  def no_attributes_error
    user.errors.add(:base, :no_attributes, message: 'No attributes given to update')
    user.errors
  end
end
