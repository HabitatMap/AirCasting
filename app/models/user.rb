class User < ApplicationRecord
  # Include default devise modules. Others available are:
  #   :encryptable, :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable,
         :registerable,
         :recoverable,
         :rememberable,
         :trackable,
         :validatable

  has_many :sessions, inverse_of: :user, dependent: :destroy
  has_many :devices, dependent: :destroy
  has_many :mobile_sessions, inverse_of: :user
  has_many :fixed_sessions, inverse_of: :user
  has_many :streams, through: :sessions
  has_many :measurements, through: :streams
  has_many :threshold_alerts, dependent: :destroy

  # Virtual attribute for devise
  attr_accessor :login

  before_create :ensure_authentication_token
  before_save :chomp_username_attribute!

  validates :username, presence: true
  validates_uniqueness_of :username, case_sensitive: false
  validates_uniqueness_of :email, case_sensitive: false

  # TokenAuthenticatable was removed from Devise in 3.1
  # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
  def ensure_authentication_token
    if authentication_token.blank?
      self.authentication_token = generate_authentication_token
    end
  end

  def as_json(*args)
    super(
      only: %i[id email username authentication_token session_stopped_alert],
    )
  end

  # Inspired by Devise wiki
  # https://github.com/plataformatec/devise/wiki/How-To:-Allow-users-to-sign-in-using-their-username-or-email-address
  # https://github.com/plataformatec/devise/wiki/How-To:-Allow-users-to-sign_in-using-their-username-or-email-address
  def self.find_for_database_authentication(conditions)
    conditions = conditions.dup

    # login if coming from mobile || email if coming from web. Both keys are
    # optional (`config.authentication_keys` marks each `false`), so read the
    # second one rather than `fetch`ing it — a body carrying neither used to
    # raise KeyError and answer 500. A blank value matches nothing, so skip the
    # query instead of running `lower(email) = ''` against every row.
    login = conditions.delete(:login).presence || conditions[:email].presence
    return if login.blank?

    where(
      [
        'authentication_token = :token OR ' + 'lower(username) = :value OR ' +
          'lower(email) = :value',
        { value: login.downcase, token: login },
      ],
    ).first
  end

  # Inspired by Devise wiki
  #
  # Devise's `PasswordsController#create` feeds whatever this returns straight
  # into `successfully_sent?`, which calls `.errors` on it. Returning `nil` for
  # an unrecognised login therefore raised `NoMethodError` and answered 500 —
  # the Android app's forgot-password dialog reported a generic failure and no
  # mail went out. An unsaved record has no errors, so the controller answers
  # the same 201 it does for a real account: no crash, and no oracle telling a
  # caller which logins exist.
  def self.send_reset_password_instructions(conditions = {})
    record = find_for_database_authentication(conditions)
    record&.send_reset_password_instructions
    record || new
  end

  def admin?
    read_attribute(:admin) || email.eql?('admin@aircasting.org')
  end

  def self.ransackable_attributes(auth_object = nil)
    [
      "email",
      "username",
      "created_at",
      "updated_at",
      "last_sign_in_at",
      "send_emails",
      "admin"
    ]
  end

  def self.ransackable_associations(auth_object = nil)
    [
      "sessions",
      "mobile_sessions",
      "fixed_sessions",
      "streams",
      "measurements",
      "threshold_alerts"
    ]
  end

  private

  def chomp_username_attribute!
    self.username.chomp!
  end

  # TokenAuthenticatable was removed from Devise in 3.1
  # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
  def generate_authentication_token
    loop do
      token = Devise.friendly_token
      break token unless User.where(authentication_token: token).first
    end
  end
end
