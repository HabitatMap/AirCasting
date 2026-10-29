class AlignGovernmentPm25ThresholdsWithAirbeam < ActiveRecord::Migration[7.0]
  # Government PM2.5 has been coloured on a different scale from AirBeam PM2.5:
  # `low` 12 against the AirBeam's 9 (the 2024 EPA annual standard). Same
  # pollutant, same unit, two colours. Confirmed with the client: government
  # PM2.5 uses the AirBeam scale.
  #
  # The split is visible today wherever a stream's own threshold_set is read —
  # GET /api/thresholds/Government-PM2.5, which the web map uses, and
  # StreamSerializer. It is NOT visible via StreamConfiguration (PM2.5 is
  # already 9 there), which is why the explore map and the station detail view
  # disagree. Correcting the row closes both gaps; no app or frontend change.
  #
  # Rows only, and threshold_sets is small — no lock worth planning around.
  # Streams keep pointing at the same threshold_set_id, so nothing is re-linked.

  class ThresholdSet < ActiveRecord::Base
    self.table_name = 'threshold_sets'
  end

  SENSOR_NAME = 'Government-PM2.5'.freeze
  STALE = {
    threshold_very_low: 0.0,
    threshold_low: 12.0,
    threshold_medium: 35.0,
    threshold_high: 55.0,
    threshold_very_high: 150.0,
  }.freeze
  CORRECTED_LOW = 9.0

  def up
    # Matched on the bands, not on unit_symbol: production holds
    # encoding-mangled units on this table ("Âµg/mÂ³", "ng/m"), and a row is
    # just as wrong under a mangled unit as under the right one. A row whose
    # other four bands differ is somebody's edited set, not this default.
    updated = ThresholdSet.where(sensor_name: SENSOR_NAME, **STALE)
                          .update_all(threshold_low: CORRECTED_LOW)

    say "aligned #{updated} #{SENSOR_NAME} row(s) to the AirBeam PM2.5 scale"

    # Pre-existing correct rows are left alone. Duplicates under this
    # sensor_name are endemic to the table and harmless here: every remaining
    # row now carries identical bands, so whichever one a lookup picks gives
    # the same answer.
  end

  def down
    # Deliberately a no-op. Rolling the deploy back must not restore a scale
    # the client has ruled wrong, and rows that already read 9 beforehand
    # cannot be told apart from rows this migration corrected.
    say "not reverting: #{SENSOR_NAME} on the 12 scale is the bug, not the baseline"
  end
end
