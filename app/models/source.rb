class Source < ApplicationRecord
  has_many :station_streams, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
end
