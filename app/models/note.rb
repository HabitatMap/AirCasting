class Note < ApplicationRecord
  self.skip_time_zone_conversion_for_attributes = %i[date]

  belongs_to :session

  validates :text, presence: true
  validates :date, presence: true
  validates :latitude, presence: true
  validates :longitude, presence: true
  validates :session, presence: true

  has_one_attached :s3_photo
end
