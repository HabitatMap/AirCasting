class MeasurementsCreator
  def initialize(
    sync_measurements_creator: SyncMeasurementsCreator.new,
    async_measurements_creator: AsyncMeasurementsCreator.new
  )
    @sync_measurements_creator = sync_measurements_creator
    @async_measurements_creator = async_measurements_creator
  end

  def call(stream, measurements_attributes)
    if stream.fixed?
      @sync_measurements_creator.call(
        stream: stream,
        measurements_attributes: measurements_attributes
      )
    else
      @async_measurements_creator.call(
        stream: stream,
        measurements_attributes: measurements_attributes
      )
    end
  end
end
