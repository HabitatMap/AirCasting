require 'rails_helper'

describe FixedSession do
  describe '#is_active' do
    it 'is true when the last measurement is inside the active window' do
      session = create(:fixed_session, last_measurement_at: 1.hour.ago)

      expect(session.is_active).to eq(true)
    end

    it 'is false when the last measurement is older than the active window' do
      session = create(:fixed_session, last_measurement_at: 2.days.ago)

      expect(session.is_active).to eq(false)
    end

    # 19k fixed rows have no last_measurement_at — the 2016 migration added the
    # column without a backfill, EPA station rows keep their measurements
    # elsewhere, and a v3 session exists before its first reading lands. Comparing
    # nil raised NoMethodError, so a single such row on a map response was a 500.
    # Falling back to created_at reads a session with no measurements yet as
    # active and an abandoned one as dormant, which is the rule the v3 filter uses.
    it 'falls back to created_at when no measurement has ever landed' do
      fresh = create(:fixed_session, last_measurement_at: nil)
      abandoned = create(:fixed_session, last_measurement_at: nil)
      abandoned.update_column(:created_at, 2.days.ago)

      expect(fresh.is_active).to eq(true)
      expect(abandoned.is_active).to eq(false)
    end
  end
end
