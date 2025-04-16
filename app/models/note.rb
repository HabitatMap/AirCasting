class Note < ApplicationRecord
  self.skip_time_zone_conversion_for_attributes = %i[date]

  belongs_to :session

  validates :text, presence: true
  validates :date, presence: true
  validates :latitude, presence: true
  validates :longitude, presence: true
  validates :session, presence: true

  has_attached_file :photo,
                    {
                      styles: {
                        thumbnail: '100x100',
                        medium: '600x600',
                      },
                      url: '/system/:hash.:extension',
                      path: ':rails_root/public/system/:hash.:extension',
                      hash_secret: A9n.attachment_secret,
                    }
  do_not_validate_attachment_file_type :photo

  has_one_attached :s3_photo

  def photo_exists?
    File.exists?(File.join(Rails.root, 'public', photo.to_s.split('?').first))
  end

  def as_json(opts = nil)
    result = super(opts)

    if s3_photo.attached?
      result.merge!(
        {
          photo:
            Rails.application.routes.url_helpers.rails_blob_url(
              s3_photo,
              only_path: true,
            ),
          photo_thumbnail:
            Rails.application.routes.url_helpers.rails_representation_url(
              s3_photo.variant(resize_to_limit: [100, 100]).processed,
              only_path: true,
            ),
        },
      )
    elsif photo_exists?
      result.merge!(
        { photo: photo.url(:medium), photo_thumbnail: photo.url(:thumbnail) },
      )
    end

    result
  end
end
