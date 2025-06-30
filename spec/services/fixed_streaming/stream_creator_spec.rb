require 'rails_helper'

RSpec.describe FixedStreaming::StreamCreator do
  subject { described_class.new }

  describe '#call' do
    let(:data) do
      {
        sensor_name: 'AirBeamMini-PM2.5',
        unit_name: 'micrograms per cubic meter',
        measurement_type: 'Particulate Matter',
        measurement_short_type: 'PM',
        unit_symbol: 'µg/m³',
        threshold_very_low: 0.0,
        threshold_low: 9.0,
        threshold_medium: 35.0,
        threshold_high: 55.0,
        threshold_very_high: 150.0,
        sensor_package_name: 'AirBeamMini:abc',
      }
    end

    context 'threshold set for given sensor and unit symbol already exists' do
      it 'creates stream and assign the existing threshold set to it' do
        session = create(:fixed_session)
        threshold_set =
          create(
            :threshold_set,
            sensor_name: 'AirBeamMini-PM2.5',
            unit_symbol: 'µg/m³',
          )

        result = subject.call(session: session, data: data)

        expect(result.session).to eq(session)
        expect(result.threshold_set).to eq(threshold_set)
        expect(ThresholdSet.count).to eq(1)
      end
    end

    context 'threshold set for given sensor and unit symbol does not exist' do
      it 'creates threshold set and stream' do
        session = create(:fixed_session)

        expect { subject.call(session: session, data: data) }.to change {
          ThresholdSet.count
        }.by(1).and change { Stream.count }.by(1)
      end
    end
  end
end
