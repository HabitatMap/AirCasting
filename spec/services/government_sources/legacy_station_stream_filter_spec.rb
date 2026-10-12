require 'rails_helper'

describe GovernmentSources::LegacyStationStreamFilter do
  subject { described_class.new }

  describe '#call' do
    it 'returns empty array when given no rows' do
      result = subject.call(rows: [], source_name: :epa)

      expect(result).to eq([])
    end

    it 'keeps new rows and filters existing ones' do
      source = create(:source, name: 'EPA')
      pm25_config =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      ozone_config =
        create(
          :stream_configuration,
          measurement_type: 'Ozone',
          canonical: true,
        )
      create(
        :fixed_stream,
        source_id: source.id,
        stream_configuration_id: pm25_config.id,
        external_ref: 'REF1',
      )
      create(
        :fixed_stream,
        source_id: source.id,
        stream_configuration_id: ozone_config.id,
        external_ref: 'REF2',
      )

      existing_pm25 =
        build_row(external_ref: 'REF1', measurement_type: 'PM2.5')
      existing_ozone =
        build_row(external_ref: 'REF2', measurement_type: 'Ozone')
      new_ozone_for_ref1 =
        build_row(external_ref: 'REF1', measurement_type: 'Ozone')
      new_pm25_for_ref2 =
        build_row(external_ref: 'REF2', measurement_type: 'PM2.5')
      new_row =
        build_row(external_ref: 'REF3', measurement_type: 'PM2.5')

      rows = [
        existing_pm25,
        existing_ozone,
        new_ozone_for_ref1,
        new_pm25_for_ref2,
        new_row,
      ]

      result = subject.call(rows: rows, source_name: :epa)

      expect(result).to contain_exactly(
        new_ozone_for_ref1,
        new_pm25_for_ref2,
        new_row,
      )
    end
  end

  private

  def build_row(overrides = {})
    GovernmentSources::StationStreamRow.new(
      {
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
        title: 'Test Station',
      }.merge(overrides),
    )
  end
end
