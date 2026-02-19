require 'rails_helper'

describe Epa::IngestOrchestrator do
  let(:ingest_batch_enqueuer) { instance_double(Epa::IngestBatchEnqueuer) }

  subject { described_class.new(ingest_batch_enqueuer: ingest_batch_enqueuer) }

  describe '#call' do
    it 'enqueues batches for last 24 hours' do
      allow(ingest_batch_enqueuer).to receive(:call)

      freeze_time do
        subject.call

        expect(ingest_batch_enqueuer).to have_received(:call).exactly(24).times
      end
    end
  end
end
