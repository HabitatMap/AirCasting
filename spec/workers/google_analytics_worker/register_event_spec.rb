require 'rails_helper'

describe GoogleAnalyticsWorker::RegisterEvent do
  describe '.async_call' do
    let(:event_action) { double }

    subject { described_class.async_call(event_action) }

    context 'when analytics are enabled' do
      before { expect(A9n).to receive(:analytics_enabled).and_return('true') }

      it 'schedules async job' do
        result = double
        expect(described_class).to receive(:perform_async)
          .with(event_action)
          .and_return(result)

        expect(subject).to eq result
      end
    end

    context 'when analytics are disabled' do
      it 'does nothing' do
        expect(described_class).not_to receive(:perform_async)

        subject
      end
    end
  end

  describe '#perform' do
    let(:event_action) { 'custom-event-action' }

    subject { described_class.new.perform(event_action) }

    it 'sends event with random client id to Google Analytics' do
      expect(HTTParty).to receive(:post) do |url, opts|
        expect(url).to eq 'https://www.google-analytics.com/collect'
        expect(
          opts.fetch(:body)
        ).to match /v=1&t=event&tid=UA-27599231-2&cid=[0-9]+\.[0-9]+&ec=Endpoint%20Hits&ea=custom-event-action/
      end

      subject
    end
  end
end
