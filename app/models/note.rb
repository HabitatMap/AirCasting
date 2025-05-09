class Note < ApplicationRecord
  self.skip_time_zone_conversion_for_attributes = %i[date]

  belongs_to :session

  validates :text, presence: true
  validates :date, presence: true
  validates :latitude, presence: true
  validates :longitude, presence: true
  validates :session, presence: true

  has_one_attached :s3_photo

  def as_json(opts = nil)
    result = super(opts)

    result.merge({ photo: photo_url, photo_thumbnail: photo_thumbnail_url })
  end

  def photo_url
    if s3_photo.attached?
      Rails.application.routes.url_helpers.rails_blob_url(
        s3_photo,
        only_path: true,
      )
    end
  end

  def photo_thumbnail_url
    if s3_photo.attached?
      Rails.application.routes.url_helpers.rails_representation_url(
        s3_photo.variant(resize_to_limit: [100, 100]).processed,
        only_path: true,
      )
    end
  end
end
