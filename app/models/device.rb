class Device < ApplicationRecord
  belongs_to :user
  has_many :sessions

  # `mac_address` is only as good as what the phone can see: Android sends the
  # last octet on some paths, iOS falls back to a value derived from the per-app
  # CoreBluetooth UUID. It is therefore unique per user, never globally.
  validates :mac_address, presence: true, uniqueness: { scope: :user_id }
  validates :model, presence: true

  before_validation :normalize_mac_address

  def self.normalize_mac_address(value)
    value.to_s.strip.upcase.presence
  end

  private

  def normalize_mac_address
    self.mac_address = self.class.normalize_mac_address(mac_address)
  end
end
