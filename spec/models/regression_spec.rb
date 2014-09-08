require 'spec_helper'

describe Regression do
  let(:target) { stub(sensor_package_name: 'target_sensor', measurements: [], sensor_name: 'Some sensor') }
  let(:reference) { stub(unit_name: 'Made-up unit',
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
  let(:calculator) { stub(new: stub(run: [1, 2, 3])) }

  describe '.build_for_streams' do
    subject { described_class.build_for_streams(target, reference, 2, calculator) }

    it 'copies proper fields from reference device' do
      %w(unit_name unit_symbol measurement_type threshold_very_low threshold_low
         threshold_medium threshold_high threshold_very_high).each do |field|
        subject.send(field).should == reference.send(field)
      end
    end

    it 'uses calculator to obtain coefficients' do
      subject.coefficients.should == [1, 2, 3]
    end

    it 'uses sensor_package_name from target' do
      subject.sensor_package_name.should == 'target_sensor'
    end
  end
end
