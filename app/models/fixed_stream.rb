class FixedStream < ApplicationRecord
  belongs_to :source
  belongs_to :stream_configuration
  has_many :fixed_stream_measurements, dependent: :delete_all

  validates :external_ref, :location, :time_zone, presence: true
  validates :external_ref,
            uniqueness: {
              scope: %i[source_id stream_configuration_id],
            }

  validate :first_before_last

  private

  def first_before_last
    if last_measured_at < first_measured_at
      errors.add(
        :last_measured_at,
        'must be after or equal to first_measured_at',
      )
    end
  end
end
