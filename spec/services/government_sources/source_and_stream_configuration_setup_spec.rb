require 'rails_helper'

describe GovernmentSources::SourceAndStreamConfigurationSetup do
  subject { described_class.new }

  def configs_for(source)
    SourceStreamConfiguration
      .where(source: source)
      .includes(:stream_configuration)
      .map(&:stream_configuration)
  end

  describe '#call' do
    it 'assigns correct stream configurations to each source' do
      subject.call

      epa = Source.find_by(name: 'EPA')
      eea = Source.find_by(name: 'EEA')

      expect(configs_for(epa).pluck(:measurement_type, :unit_symbol)).to contain_exactly(
        ['PM2.5', 'µg/m³'],
        ['NO2', 'ppb'],
        ['Ozone', 'ppb'],
      )

      expect(configs_for(eea).pluck(:measurement_type, :unit_symbol)).to contain_exactly(
        ['PM2.5', 'µg/m³'],
        ['NO2', 'µg/m³'],
        ['Ozone', 'µg/m³'],
      )
    end
  end
end
