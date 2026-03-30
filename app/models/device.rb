class Device < ApplicationRecord
  has_many :sessions
  validates :mac_address, presence: true, uniqueness: true
  validates :model, presence: true
end
