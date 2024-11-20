class ThresholdAlert < ApplicationRecord
  belongs_to :user
  belongs_to :stream

  validates_presence_of :threshold_value, :frequency
  validates :user_id,
            uniqueness: {
              scope: :stream_id,
              message:
                'Threshold alert already exists for this user and stream combination',
            }
end
