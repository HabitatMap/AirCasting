require "spec_helper"

describe MeasurementsCreator do
  it "with 1 measurement it delegates to sync_measurements_creator" do
    sync_measurements_creator = instance_double(SyncMeasurementsCreator)
    subject = MeasurementsCreator.new(sync_measurements_creator: sync_measurements_creator)
    stream = Stream.new
    measurement_attributes = [{}]

    expect(sync_measurements_creator).to receive(:call).with(stream, measurement_attributes)

    subject.call(stream, measurement_attributes)
	end

  it "with more than 1 measurement it delegates to async_measurements_creator" do
    async_measurements_creator = class_double(AsyncMeasurementsCreator)
    subject = MeasurementsCreator.new(async_measurements_creator: async_measurements_creator)
    stream_id = 1
    stream = Stream.new
    stream.id = stream_id
    measurement_attributes = [{}] * 2

    expect(async_measurements_creator).to receive(:perform_async).with(stream_id, measurement_attributes).once

    subject.call(stream, measurement_attributes)
	end

  it "with 501 measurements it delegates to async_measurements_creator by batching in groups of 500" do
    async_measurements_creator = class_double(AsyncMeasurementsCreator)
    subject = MeasurementsCreator.new(async_measurements_creator: async_measurements_creator)
    stream_id = 1
    stream = Stream.new
    stream.id = stream_id
    measurement_attributes = [{}] * 501

    expect(async_measurements_creator).to receive(:perform_async).with(stream_id, [{}] * 500).once
    expect(async_measurements_creator).to receive(:perform_async).with(stream_id, [{}]).once

    subject.call(stream, measurement_attributes)
	end
end
