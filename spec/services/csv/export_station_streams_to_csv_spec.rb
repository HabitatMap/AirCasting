require 'rails_helper'

describe Csv::ExportStationStreamsToCsv do
  subject { Csv::ExportStationStreamsToCsv.new }

  it 'with no measurements the zip just contains an empty dotfile' do
    station_stream = create(:station_stream)

    zip_path = subject.call([station_stream.id])

    Zip::File.open(zip_path) { |zip_file| expect(zip_file.size).to eq(1) }
  end

  it 'with one station stream and one measurement the zip contains one empty dotfile and one file with the correct CSV content and filename' do
    source = create(:source, name: 'Government')
    stream_config =
      create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³')
    station_stream =
      create(
        :station_stream,
        source: source,
        stream_configuration: stream_config,
        title: 'Wood Buffalo Park',
        location: 'SRID=4326;POINT(10.0 45.0)',
      )
    create(
      :station_measurement,
      station_stream: station_stream,
      measured_at: Time.utc(2025, 5, 28, 9, 0, 0),
      value: 5.0,
    )

    zip_path = subject.call([station_stream.id])

    Zip::File.open(zip_path) do |zip_file|
      actual_contents = file_content(zip_file)
      actual_filenames = file_names(zip_file)

      expected_filename = /wood_buffalo_park_#{station_stream.id}__.*\.csv$/
      expect(actual_filenames).to match(expected_filename)

      expected_contents = [
        '',
        File.read("#{Rails.root}/spec/support/station_stream_measurement.csv"),
      ]
      expect(actual_contents).to eq(expected_contents)
    end
  end

  it 'with two station streams the zip contains one dotfile and two CSV files' do
    source = create(:source, name: 'Government')
    stream_config =
      create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³')
    stream1 =
      create(
        :station_stream,
        source: source,
        stream_configuration: stream_config,
        title: 'Station A',
        location: 'SRID=4326;POINT(10.0 45.0)',
      )
    stream2 =
      create(
        :station_stream,
        source: source,
        stream_configuration: stream_config,
        title: 'Station B',
        location: 'SRID=4326;POINT(11.0 46.0)',
      )
    create(
      :station_measurement,
      station_stream: stream1,
      measured_at: Time.utc(2025, 5, 28, 9, 0, 0),
      value: 5.0,
    )
    create(
      :station_measurement,
      station_stream: stream2,
      measured_at: Time.utc(2025, 5, 28, 10, 0, 0),
      value: 7.0,
    )

    zip_path = subject.call([stream1.id, stream2.id])

    Zip::File.open(zip_path) do |zip_file|
      expect(zip_file.size).to eq(3)
    end
  end

  it 'names the zip file with sessions_ prefix' do
    station_stream = create(:station_stream)

    zip_path = subject.call([station_stream.id])

    expect(File.basename(zip_path)).to match(/^sessions_\d+.*\.zip$/)
  end

  context 'CSV format contract' do
    it_behaves_like 'a CSV with standard AirCasting measurement format' do
      let(:csv_rows) do
        CSV.parse(
          File.read("#{Rails.root}/spec/support/station_stream_measurement.csv"),
        )
      end
    end
  end

  private

  def file_content(zip_file)
    zip_file.entries.map { |entry| entry.get_input_stream.read }
  end

  def file_names(zip_file)
    zip_file.entries.map(&:name).join(', ')
  end
end
