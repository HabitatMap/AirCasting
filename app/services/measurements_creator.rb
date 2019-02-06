class MeasurementsCreator
  SLICE_SIZE = 500

  def initialize(
    sync_measurements_creator: SyncMeasurementsCreator.new,
    async_measurements_creator: AsyncMeasurementsCreator
  )
    @sync_measurements_creator = sync_measurements_creator
    @async_measurements_creator = async_measurements_creator
  end

  def call(stream, measurements_attributes)
    if measurements_attributes.one?
      @sync_measurements_creator.call(stream, measurements_attributes)
    else
      measurements_attributes.each_slice(SLICE_SIZE) do |measurement_attributes|
        @async_measurements_creator.perform_async(stream.id, measurement_attributes)
      end
    end
  end
end
