require 'rails_helper'

describe RebuildStationStreamDailyAveragesWorker do
  let(:rebuilder) { instance_double(GovernmentSources::StationStreamDailyAveragesRebuilder, call: nil) }

  before do
    allow(GovernmentSources::StationStreamDailyAveragesRebuilder).to receive(:new).and_return(rebuilder)
  end

  it 'rebuilds the given streams' do
    allow(A9n).to receive(:sidekiq_averages_calculation_enabled).and_return(true)

    described_class.new.perform([1, 2])

    expect(rebuilder).to have_received(:call).with(stream_ids: [1, 2])
  end

  it 'does nothing while averages calculation is disabled' do
    allow(A9n).to receive(:sidekiq_averages_calculation_enabled).and_return(false)

    described_class.new.perform([1, 2])

    expect(rebuilder).not_to have_received(:call)
  end
end
