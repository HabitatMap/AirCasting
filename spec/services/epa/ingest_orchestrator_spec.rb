require 'rails_helper'

describe Epa::IngestOrchestrator do
  let(:staging_batch_dispatcher) { instance_double(Epa::StagingBatchDispatcher) }

  subject { described_class.new(staging_batch_dispatcher: staging_batch_dispatcher) }

  before { allow(staging_batch_dispatcher).to receive(:call) }

  describe '#call' do
    it 'dispatches batches for last 24 hours' do
      freeze_time do
        subject.call

        expect(staging_batch_dispatcher).to have_received(:call).exactly(24).times
      end
    end

    it 'creates an ingest cycle' do
      expect { subject.call }.to change(EpaIngestCycle, :count).by(1)
    end

    it 'creates a load batch for each measurement type' do
      expect { subject.call }.to change(EpaLoadBatch, :count).by(Epa::MEASUREMENT_TYPES.size)
    end

    it 'dispatches each batch with the cycle id' do
      subject.call

      cycle = EpaIngestCycle.last
      expect(staging_batch_dispatcher).to have_received(:call)
        .with(hash_including(epa_ingest_cycle_id: cycle.id))
        .exactly(24).times
    end
  end
end
