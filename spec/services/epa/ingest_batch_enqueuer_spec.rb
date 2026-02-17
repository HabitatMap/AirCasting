require 'rails_helper'

describe Epa::IngestBatchEnqueuer do
  let(:extract_worker) { double('ExtractWorker') }

  subject { described_class.new(extract_worker: extract_worker) }

  describe '#call' do
    it 'creates a new batch' do
      allow(extract_worker).to receive(:perform_async)
      measured_at = Time.parse('2025-07-24 09:00:00 UTC')

      expect { subject.call(measured_at: measured_at) }.to change(
        EpaIngestBatch,
        :count,
      ).by(1)
    end

    it 'enqueues extract worker with batch id' do
      allow(extract_worker).to receive(:perform_async)
      measured_at = Time.parse('2025-07-24 09:00:00 UTC')

      subject.call(measured_at: measured_at)

      batch = EpaIngestBatch.last
      expect(extract_worker).to have_received(:perform_async).with(batch.id)
    end
  end
end
