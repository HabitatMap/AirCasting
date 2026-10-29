# The GET /api/v3/threshold_sets body. Every key is always present, because
# Swift's Codable fails the whole decode on a missing key and a KMP DTO
# property with no default throws MissingFieldException.
#
# Separate from ThresholdSetSerializer, which renders a bare array of
# stringified, integer-truncated bands for the web frontend's
# GET /api/thresholds/:id. That shape cannot carry a sensor name or a unit and
# loses float precision; it is kept only because the frontend parses it.
class DefaultThresholdSetsSerializer
  def initialize(entries)
    @entries = entries
  end

  def call
    { threshold_sets: @entries.map { |entry| set(entry) } }
  end

  private

  def set(entry)
    {
      sensor_name: entry.sensor_name,
      measurement_type: entry.measurement_type,
      unit_symbol: entry.unit_symbol,
      aliases: entry.aliases,
      thresholds: {
        very_low: entry.thresholds.very_low,
        low: entry.thresholds.low,
        medium: entry.thresholds.medium,
        high: entry.thresholds.high,
        very_high: entry.thresholds.very_high,
      },
    }
  end
end
