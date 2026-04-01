require 'rails_helper'

RSpec.describe Sensor do
  describe 'CANONICAL_SENSOR_NAME_MAP' do
    it 'maps AirBeamMini2 sensor names to canonical names' do
      expect(described_class::CANONICAL_SENSOR_NAME_MAP['AirBeamMini2-PM2.5']).to eq('AirBeam-PM2.5')
      expect(described_class::CANONICAL_SENSOR_NAME_MAP['AirBeamMini2-PM1']).to eq('AirBeam-PM1')
      expect(described_class::CANONICAL_SENSOR_NAME_MAP['AirBeamMini2-PM10']).to eq('AirBeam-PM10')
      expect(described_class::CANONICAL_SENSOR_NAME_MAP['AirBeamMini2-RH']).to eq('AirBeam-RH')
      expect(described_class::CANONICAL_SENSOR_NAME_MAP['AirBeamMini2-F']).to eq('AirBeam-F')
    end
  end

  describe 'CANONICAL_SENSOR_TYPE_IDS' do
    it 'assigns stable integer IDs per canonical sensor name' do
      expect(described_class::CANONICAL_SENSOR_TYPE_IDS['AirBeam-PM1']).to eq(1)
      expect(described_class::CANONICAL_SENSOR_TYPE_IDS['AirBeam-PM2.5']).to eq(2)
      expect(described_class::CANONICAL_SENSOR_TYPE_IDS['AirBeam-PM10']).to eq(3)
      expect(described_class::CANONICAL_SENSOR_TYPE_IDS['AirBeam-RH']).to eq(4)
      expect(described_class::CANONICAL_SENSOR_TYPE_IDS['AirBeam-F']).to eq(5)
    end
  end

  describe '.canonical_sensor_name' do
    it 'resolves AirBeamMini2 sensor names' do
      expect(described_class.canonical_sensor_name('AirBeamMini2-PM2.5')).to eq('AirBeam-PM2.5')
    end

    it 'returns the name unchanged when not in the map' do
      expect(described_class.canonical_sensor_name('Unknown-Sensor')).to eq('Unknown-Sensor')
    end
  end
end
