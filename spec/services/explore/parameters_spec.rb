require 'rails_helper'

describe Explore::Parameters do
  describe '.select' do
    it 'selects every parameter when given none' do
      expect(described_class.select([]).keys).to eq(described_class::KEYS)
      expect(described_class.select(nil).keys).to eq(described_class::KEYS)
    end

    it 'keeps catalogue order and drops repeats' do
      expect(described_class.select(%w[ozone pm ozone]).keys).to eq(%w[pm ozone])
    end

    it 'rejects a parameter that is not in the catalogue' do
      expect { described_class.select(%w[pm pm10]) }.to raise_error(
        described_class::UnknownParameter,
        /pm10/,
      )
    end
  end

  describe '#airbeam_sensor_names' do
    it 'matches every model spelling of PM2.5 and the canonical name' do
      expect(described_class.select(%w[pm]).airbeam_sensor_names).to contain_exactly(
        'airbeam-pm2.5',
        'airbeam-pm',
        'airbeam2-pm2.5',
        'airbeam3-pm2.5',
        'airbeammini-pm2.5',
      )
    end

    it 'leaves PM1 and PM10 out' do
      names = described_class.select([]).airbeam_sensor_names

      expect(names.grep(/pm1\z|pm10\z/)).to be_empty
    end

    it 'unions the spellings of every selected parameter' do
      names = described_class.select(%w[temperature humidity]).airbeam_sensor_names

      expect(names).to include('airbeam3-f', 'airbeam-f', 'airbeammini-rh', 'airbeam-rh')
    end
  end

  describe '#government_measurement_types' do
    it 'lists the measurement types of the selected parameters' do
      expect(described_class.select(%w[pm ozone]).government_measurement_types).to eq(
        %w[PM2.5 Ozone],
      )
    end
  end

  describe 'sources without a selected parameter' do
    it 'needs no government query for temperature and humidity' do
      selection = described_class.select(%w[temperature humidity])

      expect(selection.government?).to be(false)
      expect(selection.airbeam?).to be(true)
    end

    it 'needs no AirBeam query for NO2 and ozone' do
      selection = described_class.select(%w[no2 ozone])

      expect(selection.airbeam?).to be(false)
      expect(selection.government?).to be(true)
    end
  end

  describe '#parameter_for_airbeam' do
    subject { described_class.select(%w[pm humidity]) }

    it 'maps a stored sensor name back to its parameter, ignoring case' do
      expect(subject.parameter_for_airbeam('AirBeamMini-PM2.5')).to eq('pm')
      expect(subject.parameter_for_airbeam('AIRBEAM3-RH')).to eq('humidity')
    end

    it 'returns nil for a sensor of an unselected parameter' do
      expect(subject.parameter_for_airbeam('AirBeam3-F')).to be_nil
    end

    it 'returns nil for a sensor outside the catalogue' do
      expect(subject.parameter_for_airbeam('AirBeam3-PM10')).to be_nil
    end
  end

  describe '#parameter_for_government' do
    it 'maps a measurement type back to its parameter' do
      selection = described_class.select(%w[no2])

      expect(selection.parameter_for_government('NO2')).to eq('no2')
      expect(selection.parameter_for_government('PM2.5')).to be_nil
    end
  end
end
