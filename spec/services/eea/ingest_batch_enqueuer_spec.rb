require 'rails_helper'

describe Eea::IngestBatchEnqueuer do
  let(:download_zip_worker) { class_double(Eea::DownloadZipWorker) }

  subject { described_class.new(download_zip_worker: download_zip_worker) }

  before { allow(download_zip_worker).to receive(:perform_async) }

  let(:params) do
    {
      country: 'PL',
      pollutant: 'PM2.5',
      window_starts_at: Time.current.beginning_of_hour - 6.hours,
      window_ends_at: Time.current.beginning_of_hour,
    }
  end

  describe '#call' do
    it 'creates a new ingest batch' do
      expect { subject.call(**params) }.to change(EeaIngestBatch, :count).by(1)
    end

    it 'enqueues a DownloadZipWorker with the new batch id' do
      subject.call(**params)

      batch = EeaIngestBatch.last
      expect(download_zip_worker).to have_received(:perform_async).with(batch.id)
    end

    it 'always creates a new batch even when called twice with the same parameters' do
      expect { 2.times { subject.call(**params) } }.to change(EeaIngestBatch, :count).by(2)
    end
  end
end
