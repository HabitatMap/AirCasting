require 'rails_helper'

describe Eea::IngestOrchestrator do
  let(:ingest_batch_enqueuer) { instance_double(Eea::IngestBatchEnqueuer) }

  subject { described_class.new(ingest_batch_enqueuer: ingest_batch_enqueuer) }

  before { allow(ingest_batch_enqueuer).to receive(:call) }

  describe '#call' do
    it 'dispatches a batch for every country and pollutant combination' do
      freeze_time do
        subject.call

        expect(ingest_batch_enqueuer).to have_received(:call).exactly(
          Eea::IngestOrchestrator::COUNTRIES.size * Eea::IngestOrchestrator::POLLUTANTS.size,
        ).times
      end
    end

    it 'passes the correct time window to each call' do
      freeze_time do
        subject.call

        expected_window_starts_at = Time.current.utc - 6.hours
        expected_window_ends_at = expected_window_starts_at + 1.day

        expect(ingest_batch_enqueuer).to have_received(:call)
          .with(
            hash_including(
              window_starts_at: expected_window_starts_at,
              window_ends_at: expected_window_ends_at,
            ),
          )
          .at_least(:once)
      end
    end

    it 'covers all countries and all pollutants' do
      freeze_time do
        subject.call

        Eea::IngestOrchestrator::COUNTRIES.each do |country|
          Eea::IngestOrchestrator::POLLUTANTS.each do |pollutant|
            expect(ingest_batch_enqueuer).to have_received(:call).with(
              hash_including(country: country, pollutant: pollutant),
            )
          end
        end
      end
    end
  end
end
