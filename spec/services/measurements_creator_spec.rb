require 'spec_helper'

describe MeasurementsCreator do
  it 'with fixed stream it delegates to sync_measurements_creator' do
    sync_measurements_creator = instance_double(SyncMeasurementsCreator)
    subject =
      MeasurementsCreator.new(
        sync_measurements_creator: sync_measurements_creator
      )
    stream = Stream.new(session: FixedSession.new)
    measurement_attributes = [{}]

    expect(sync_measurements_creator).to receive(:call).with(
      stream: stream,
      measurements_attributes: measurement_attributes
    )

    subject.call(stream, measurement_attributes)
  end

  it 'with mobile stream it delegates to async_measurements_creator' do
    async_measurements_creator = instance_double(AsyncMeasurementsCreator)
    subject =
      MeasurementsCreator.new(
        async_measurements_creator: async_measurements_creator
      )
    stream = Stream.new(session: MobileSession.new)
    measurement_attributes = [{}]

    expect(async_measurements_creator).to receive(:call)
      .with(stream: stream, measurements_attributes: measurement_attributes)
      .once

    subject.call(stream, measurement_attributes)
  end
end
