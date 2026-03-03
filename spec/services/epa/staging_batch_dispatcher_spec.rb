require 'rails_helper'

describe Epa::StagingBatchDispatcher do
  let(:extract_worker) { double('ExtractWorker') }

  subject { described_class.new(extract_worker: extract_worker) }

  describe '#call' do
    it 'creates a new batch' do
      allow(extract_worker).to receive(:perform_async)
      measured_at = Time.parse('2025-07-24 09:00:00 UTC')
      cycle = create(:epa_ingest_cycle)

      expect {
        subject.call(measured_at: measured_at, epa_ingest_cycle_id: cycle.id)
      }.to change(EpaStagingBatch, :count).by(1)
    end

    it 'enqueues extract worker with batch id' do
      allow(extract_worker).to receive(:perform_async)
      measured_at = Time.parse('2025-07-24 09:00:00 UTC')
      cycle = create(:epa_ingest_cycle)

      subject.call(measured_at: measured_at, epa_ingest_cycle_id: cycle.id)

      batch = EpaStagingBatch.last
      expect(extract_worker).to have_received(:perform_async).with(batch.id)
    end
  end
end
