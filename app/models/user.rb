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

    # login if coming from mobile || email if coming from web
    login = conditions.delete(:login) || conditions.fetch(:email)

    where(
      [
        'authentication_token = :token OR ' + 'lower(username) = :value OR ' +
          'lower(email) = :value',
        { value: login.downcase, token: login },
      ],
    ).first
  end

  # Inspired by Devise wiki
  def self.send_reset_password_instructions(conditions = {})
    record = find_for_database_authentication(conditions)
    record.send_reset_password_instructions if record
    record
  end

  def sync(data)
    upload = []
    deleted = []

    data.each do |session_data|
      uuid = session_data[:uuid]
      already_deleted_session =
        DeletedSession.where(uuid: uuid, user_id: self.id).first

      if already_deleted_session
        deleted << already_deleted_session[:uuid]
      else
        session = sessions.find_by_uuid(uuid)

        if session
          if session_data[:deleted]
            session.destroy
            already_deleted_session =
              DeletedSession.where(uuid: uuid, user_id: self.id).first
            deleted << already_deleted_session[:uuid]
          else
            session.sync(session_data)
          end
        elsif !session && !session_data[:deleted]
          # session hasn't been yet uploaded by the mobile app
          upload << uuid
        else
          # session was not found && session_data[:deleted] == true
        end
      end
    end

    uuids = data.map { |x| x[:uuid] }
    download =
      sessions
        .where.not(uuid: uuids)
        .select do |session|
          (session.streams.count != 0) &&
            (session.streams.all? { |stream| stream.measurements.count != 0 })
        end
        .map(&:id)

    { upload: upload, download: download, deleted: deleted }
  end

  def admin?
    read_attribute(:admin) || email.eql?('admin@aircasting.org')
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
