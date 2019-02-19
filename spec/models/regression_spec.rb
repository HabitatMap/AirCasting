require 'rails_helper'

describe Regression do
  let(:target) { double(sensor_package_name: 'target_sensor', measurements: [], sensor_name: 'Some sensor') }
  let(:reference) { double(unit_name: 'Made-up unit',
                         unit_symbol: 'Muu',
                         measurement_type: 'Made-up Quantity',
                         measurement_short_type: 'MuQ',
                         sensor_name: 'AirCasting Made-uper',
                         sensor_package_name: 'Made-up package',
                         threshold_very_low: 10,
                         threshold_low: 20,
                         threshold_medium: 30,
                         threshold_high: 40,
                         threshold_very_high: 50,
                         measurements: []) }
  let(:calculator) { double(new: double(run: [1, 2, 3])) }

  describe '.build_for_streams' do
    subject { described_class.build_for_streams(target, reference, 2, calculator) }

    it 'copies proper fields from reference device' do
      %w(unit_name unit_symbol measurement_type threshold_very_low threshold_low
         threshold_medium threshold_high threshold_very_high).each do |field|
        expect(subject.send(field)).to eq(reference.send(field))
      end
    end

    it 'uses calculator to obtain coefficients' do
      expect(subject.coefficients).to eq([1, 2, 3])
    end

    it 'uses sensor_package_name from target' do
      expect(subject.sensor_package_name).to eq('target_sensor')
    end
  end
end
