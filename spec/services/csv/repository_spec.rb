require 'rails_helper'

describe Csv::Repository do
  before(:each) { @subject = Csv::Repository.new }

  describe '#find_streams' do
    it 'when sensor_package_name includes a " it does not raise' do
      expect { @subject.find_streams(random_int, '"') }.not_to raise_error
    end

    it "when sensor_package_name includes a ' it does not raise" do
      expect { @subject.find_streams(random_int, "'") }.not_to raise_error
    end
  end

  describe '#find_measurements' do
    it 'when sensor_package_name includes a " it does not raise' do
      expect { @subject.find_measurements(random_int, '"') }.not_to raise_error
    end

    it "when sensor_package_name includes a ' it does not raise" do
      expect { @subject.find_measurements(random_int, "'") }.not_to raise_error
    end
  end

  private

  def random_int
    rand(1_000)
  end
end
