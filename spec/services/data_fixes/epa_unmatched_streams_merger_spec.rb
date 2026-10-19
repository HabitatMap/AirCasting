require 'rails_helper'

describe DataFixes::EpaUnmatchedStreamsMerger do
  let!(:source) { create(:source, name: 'EPA') }
  let!(:pm25) do
    create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
  end
  let!(:ozone) do
    create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
  end
  let(:station) { create(:station, source: source, external_ref: '840530330010') }
  let(:logger) { instance_double(Logger, info: nil) }

  subject { described_class.new(logger: logger) }

  describe '#call' do
    it 'moves the measurements into the stream of the same station and type and deletes the UNMATCHED stream' do
      target = create_stream(external_ref: '530330010', hours: [hour(10, 0)])
      unmatched = create_stream(external_ref: 'UNMATCHED-1', hours: [hour(1, 0), hour(1, 1)])

      counts = subject.call(apply: true)

      expect(StationStream.exists?(unmatched.id)).to be(false)
      expect(target.station_measurements.order(:measured_at).pluck(:measured_at))
        .to eq([hour(1, 0), hour(1, 1), hour(10, 0)])
      expect(counts[:merge]).to eq(1)
    end

    it 'keeps the target value for an hour both streams have' do
      target = create_stream(external_ref: '530330010', hours: { hour(1, 0) => 5 })
      create_stream(external_ref: 'UNMATCHED-1', hours: { hour(1, 0) => 99, hour(1, 1) => 7 })

      subject.call(apply: true)

      expect(target.station_measurements.order(:measured_at).pluck(:value))
        .to eq([5, 7])
    end

    it 'widens the measured range of the target and rebuilds its daily averages' do
      target = create_stream(external_ref: '530330010', hours: { hour(10, 1) => 4 })
      unmatched = create_stream(external_ref: 'UNMATCHED-1', hours: { hour(1, 1) => 8, hour(1, 2) => 12 })
      create(:station_stream_daily_average, station_stream: unmatched, date: Date.new(2024, 1, 1), value: 10)

      subject.call(apply: true)

      target.reload
      expect(target.first_measured_at).to eq(hour(1, 1))
      expect(target.last_measured_at).to eq(hour(10, 1))
      expect(target.station_stream_daily_averages.order(:date).pluck(:date, :value))
        .to eq([[Date.new(2024, 1, 1), 10], [Date.new(2024, 1, 10), 4]])
    end

    it 'merges several UNMATCHED streams into one target' do
      target = create_stream(external_ref: '530330010', hours: [hour(10, 0)])
      create_stream(external_ref: 'UNMATCHED-1', hours: [hour(1, 0)])
      create_stream(external_ref: 'UNMATCHED-2', hours: [hour(2, 0)])

      counts = subject.call(apply: true)

      expect(counts[:merge]).to eq(2)
      expect(target.station_measurements.count).to eq(3)
      expect(StationStream.where(station: station).pluck(:id)).to eq([target.id])
    end

    it 'leaves a stream with no stream of its station and type alone' do
      create_stream(external_ref: '530330010', stream_configuration: ozone)
      unmatched = create_stream(external_ref: 'UNMATCHED-1', hours: [hour(1, 0)])

      counts = subject.call(apply: true)

      expect(StationStream.exists?(unmatched.id)).to be(true)
      expect(counts[:no_target]).to eq(1)
    end

    it 'leaves a stream whose station has two streams of its type alone' do
      create_stream(external_ref: '530330010')
      create_stream(external_ref: '530330011')
      unmatched = create_stream(external_ref: 'UNMATCHED-1', hours: [hour(1, 0)])

      counts = subject.call(apply: true)

      expect(StationStream.exists?(unmatched.id)).to be(true)
      expect(counts[:several_targets]).to eq(1)
    end

    it 'leaves an UNMATCHED stream without a station alone' do
      create_stream(external_ref: '530330010')
      unmatched = create_stream(external_ref: 'UNMATCHED-1', station: nil)

      subject.call(apply: true)

      expect(StationStream.exists?(unmatched.id)).to be(true)
    end

    it 'merges a hand-checked ref into the stream of its new ref, without a station' do
      target = create_stream(external_ref: '840530330095', hours: [hour(5, 1)])
      old = create_stream(external_ref: '840530330090', station: nil, hours: [hour(4, 23)])
      create_stream(external_ref: '840530330090', station: nil, stream_configuration: ozone)

      counts = subject.call(apply: true)

      expect(StationStream.exists?(old.id)).to be(false)
      expect(target.station_measurements.count).to eq(2)
      expect(counts).to eq({ merge: 1, no_target: 1 })
    end

    describe 'a hand-checked ref split by date' do
      let!(:st_pete) do
        create_stream(external_ref: '840121030028', hours: { Time.utc(2025, 2, 7, 12) => 3 })
      end
      let!(:ft_dodge) do
        create_stream(external_ref: '840191870013', hours: { Time.utc(2025, 7, 4, 15) => 4 })
      end

      it 'moves each piece into the stream of its ref and deletes the stream' do
        bucket =
          create_stream(
            external_ref: 'CC0096625',
            station: nil,
            hours: { Time.utc(2025, 2, 6, 13) => 8, Time.utc(2025, 7, 4, 14) => 6 },
          )

        counts = subject.call(apply: true)

        expect(counts).to eq({ split: 1 })
        expect(StationStream.exists?(bucket.id)).to be(false)
        expect(st_pete.station_measurements.order(:measured_at).pluck(:measured_at, :value))
          .to eq([[Time.utc(2025, 2, 6, 13), 8], [Time.utc(2025, 2, 7, 12), 3]])
        expect(ft_dodge.station_measurements.order(:measured_at).pluck(:measured_at, :value))
          .to eq([[Time.utc(2025, 7, 4, 14), 6], [Time.utc(2025, 7, 4, 15), 4]])
        expect(st_pete.reload.first_measured_at).to eq(Time.utc(2025, 2, 6, 13))
        expect(st_pete.last_measured_at).to eq(Time.utc(2025, 2, 7, 12))
        expect(ft_dodge.reload.first_measured_at).to eq(Time.utc(2025, 7, 4, 14))
        expect(st_pete.station_stream_daily_averages.order(:date).pluck(:date))
          .to eq([Date.new(2025, 2, 6), Date.new(2025, 2, 7)])
      end

      it 'deletes the stream when no piece has hours' do
        bucket = create_stream(external_ref: 'CC0096625', station: nil, stream_configuration: ozone)

        counts = subject.call(apply: true)

        expect(counts).to eq({ split: 1 })
        expect(StationStream.exists?(bucket.id)).to be(false)
      end

      it 'leaves the stream alone when a piece with hours has no target' do
        create_stream(external_ref: '840121030028', stream_configuration: ozone)
        bucket =
          create_stream(
            external_ref: 'CC0096625',
            station: nil,
            stream_configuration: ozone,
            hours: [Time.utc(2025, 2, 6, 13), Time.utc(2025, 7, 4, 14)],
          )

        counts = subject.call(apply: true)

        expect(counts).to eq({ no_target: 1 })
        expect(bucket.station_measurements.count).to eq(2)
        expect(logger).to have_received(:info)
          .with(a_string_including('no_target piece=2025-03-01.. ref=840191870013'))
      end

      it 'writes nothing on a dry run and logs each piece' do
        bucket =
          create_stream(
            external_ref: 'CC0096625',
            station: nil,
            hours: [Time.utc(2025, 2, 6, 13), Time.utc(2025, 2, 7, 12)],
          )

        subject.call

        expect(bucket.station_measurements.count).to eq(2)
        expect(logger).to have_received(:info).with(
          a_string_including(
            "piece=..2025-03-01 target=#{st_pete.id} ref=840121030028 moved=1 " \
              'dropped_overlap=1 first=2025-02-06T13:00:00Z last=2025-02-07T12:00:00Z',
          ),
        )
      end
    end

    it 'writes nothing on a dry run' do
      target = create_stream(external_ref: '530330010', hours: [hour(1, 0)])
      unmatched = create_stream(external_ref: 'UNMATCHED-1', hours: [hour(1, 0), hour(1, 1)])

      counts = subject.call

      expect(StationStream.exists?(unmatched.id)).to be(true)
      expect(target.station_measurements.count).to eq(1)
      expect(counts[:merge]).to eq(1)
      expect(logger).to have_received(:info)
        .with(a_string_including('moved=1 dropped_overlap=1'))
    end

    it 'merges at most limit streams' do
      create_stream(external_ref: '530330010')
      create_stream(external_ref: 'UNMATCHED-1', hours: [hour(1, 0)])
      second = create_stream(external_ref: 'UNMATCHED-2', hours: [hour(2, 0)])

      counts = subject.call(apply: true, limit: 1)

      expect(counts[:merge]).to eq(1)
      expect(StationStream.exists?(second.id)).to be(true)
    end

    it 'flags a target far from the UNMATCHED stream' do
      create_stream(external_ref: '530330010')
      create_stream(external_ref: 'UNMATCHED-1', location: point(48.0, -122.0644))

      subject.call

      expect(logger).to have_received(:info).with(a_string_including('far=49km'))
    end
  end

  def create_stream(hours: [], station: self.station, **attributes)
    values = hours.is_a?(Hash) ? hours : hours.index_with { 12.5 }
    create(
      :station_stream,
      source: source,
      station: station,
      stream_configuration: pm25,
      location: point(47.5617, -122.0644),
      time_zone: 'UTC',
      first_measured_at: values.keys.min,
      last_measured_at: values.keys.max,
      **attributes,
    ).tap do |stream|
      values.each do |measured_at, value|
        create(:station_measurement, station_stream: stream, measured_at: measured_at, value: value)
      end
    end
  end

  def hour(day, hour)
    Time.utc(2024, 1, day, hour)
  end

  def point(latitude, longitude)
    "SRID=4326;POINT(#{longitude} #{latitude})"
  end
end
