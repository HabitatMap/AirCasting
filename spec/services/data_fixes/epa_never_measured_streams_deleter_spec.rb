require 'rails_helper'

describe DataFixes::EpaNeverMeasuredStreamsDeleter do
  let!(:source) { create(:source, name: 'EPA') }
  let!(:pm25) do
    create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
  end
  let(:station) { create(:station, source: source, external_ref: '840530330010') }
  let(:logger) { instance_double(Logger, info: nil) }

  subject { described_class.new(logger: logger) }

  describe '#call' do
    it 'deletes a stream with no station that was never measured' do
      stream = create_stream(external_ref: '320030023')

      deleted = subject.call(apply: true)

      expect(deleted).to eq(1)
      expect(StationStream.exists?(stream.id)).to be(false)
    end

    it 'keeps a never-measured stream that has a station' do
      stream = create_stream(external_ref: '530330010', station: station)

      subject.call(apply: true)

      expect(StationStream.exists?(stream.id)).to be(true)
    end

    it 'keeps a stream with a measured range' do
      stream =
        create_stream(
          external_ref: '320030023',
          first_measured_at: Time.utc(2024, 1, 1, 1),
          last_measured_at: Time.utc(2024, 1, 1, 1),
        )

      subject.call(apply: true)

      expect(StationStream.exists?(stream.id)).to be(true)
    end

    it 'keeps a stream with a measurement even when its range is empty' do
      stream = create_stream(external_ref: '320030023')
      create(:station_measurement, station_stream: stream)

      subject.call(apply: true)

      expect(StationStream.exists?(stream.id)).to be(true)
    end

    it 'keeps a stream with a daily average' do
      stream = create_stream(external_ref: '320030023')
      create(:station_stream_daily_average, station_stream: stream)

      subject.call(apply: true)

      expect(StationStream.exists?(stream.id)).to be(true)
    end

    it 'keeps streams of other sources' do
      other = create(:source, name: 'EEA')
      stream = create_stream(external_ref: 'SPO.1', source: other)

      subject.call(apply: true)

      expect(StationStream.exists?(stream.id)).to be(true)
    end

    it 'writes nothing on a dry run and logs what it would delete' do
      stream = create_stream(external_ref: '320030023', title: 'Mesquite')

      count = subject.call

      expect(count).to eq(1)
      expect(StationStream.exists?(stream.id)).to be(true)
      expect(logger).to have_received(:info)
        .with(a_string_including('ref=320030023 type=PM2.5 title="Mesquite"'))
    end
  end

  def create_stream(station: nil, **attributes)
    create(
      :station_stream,
      source: source,
      station: station,
      stream_configuration: pm25,
      first_measured_at: nil,
      last_measured_at: nil,
      **attributes,
    )
  end
end
