class SourceStreamConfiguration < ApplicationRecord
  belongs_to :source
  belongs_to :stream_configuration

  validates :stream_configuration_id, uniqueness: { scope: :source_id }
end
