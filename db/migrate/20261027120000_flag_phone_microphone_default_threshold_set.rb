class FlagPhoneMicrophoneDefaultThresholdSet < ActiveRecord::Migration[7.0]
  # `Phone Microphone` is an officially supported session type but has never had
  # a row flagged `is_default`. Everything still worked by accident:
  # `Stream.thresholds` falls through to a most-popular-row branch, and that
  # branch returns set 1 — the 20/60/70/80/100 bands both apps ship, carrying
  # ~66k streams and every mic stream recorded since 2023-08-24.
  #
  # What did not work: POST /api/v3/{mobile,fixed}_sessions raises
  # MissingThresholdsError when a client omits `thresholds` for this sensor, and
  # GET /api/v3/threshold_sets has to rely on an id tie-break to find the row.
  # Flag the row that is already winning rather than inserting a new one, so no
  # stream changes which set it points at.
  #
  # Data only, one row, no lock worth planning around.

  # Isolated from app/models/threshold_set.rb: a later validation or default
  # scope there must not change what this migration did.
  class ThresholdSet < ActiveRecord::Base
    self.table_name = 'threshold_sets'
  end

  SENSOR_NAME = 'Phone Microphone'.freeze
  UNIT_SYMBOL = 'dB'.freeze
  BANDS = {
    threshold_very_low: 20.0,
    threshold_low: 60.0,
    threshold_medium: 70.0,
    threshold_high: 80.0,
    threshold_very_high: 100.0,
  }.freeze

  def up
    # Matched on the bands, not on id: production also holds a `Phone Microphone`
    # row with threshold_very_low -100 (id 1425) and several typo spellings
    # ("Phone microphone", "Phone Microphone-dB", "test"). Only the exact
    # canonical name and exact bands may be promoted.
    scope = ThresholdSet.where(sensor_name: SENSOR_NAME, unit_symbol: UNIT_SYMBOL)

    if scope.where(is_default: true).exists?
      say "#{SENSOR_NAME} (#{UNIT_SYMBOL}) already has a default set — nothing to do"
      return
    end

    # Lowest id on a tie: the oldest row is the one streams accumulated against.
    set = scope.where(BANDS).order(:id).first

    if set
      set.update!(is_default: true)
      say "flagged threshold set #{set.id} as the #{SENSOR_NAME} default"
    else
      set = ThresholdSet.create!(
        **BANDS,
        sensor_name: SENSOR_NAME,
        unit_symbol: UNIT_SYMBOL,
        is_default: true,
      )
      say "created threshold set #{set.id} as the #{SENSOR_NAME} default"
    end
  end

  def down
    # Unflag rather than delete: the row predates this migration everywhere it
    # matters, and streams point at it.
    ThresholdSet
      .where(sensor_name: SENSOR_NAME, unit_symbol: UNIT_SYMBOL, is_default: true)
      .where(BANDS)
      .update_all(is_default: false)
  end
end
