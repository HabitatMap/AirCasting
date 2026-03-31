# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::ScheduleSessionsExport do
  describe '#call' do
    it 'returns failure when session export limit is exceeded' do
      stub_const('Api::ExportLimits::SESSION_IDS_MAX_STANDARD', 1)
      sessions = create_list(:mobile_session, 2)
      contract =
        Api::ExportSessionsContract.new.call(
          email: 'a@b.com',
          session_ids: sessions.map(&:id),
        )

      result = described_class.new(contract: contract).call

      expect(result.success?).to be false
      expect(result.errors[:session_ids].first).to include('cannot export more than 1')
    end

    it 'schedules worker when within limit' do
      session = create(:mobile_session)
      contract =
        Api::ExportSessionsContract.new.call(
          email: 'a@b.com',
          session_ids: [session.id],
        )
      allow(ExportSessionsWorker).to receive(:perform_async)

      result = described_class.new(contract: contract).call

      expect(result.success?).to be true
      expect(ExportSessionsWorker).to have_received(:perform_async).with(
        [session.id],
        'a@b.com',
      )
    end
  end
end
