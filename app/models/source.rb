class Source < ApplicationRecord
  has_many :fixed_streams, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
end
