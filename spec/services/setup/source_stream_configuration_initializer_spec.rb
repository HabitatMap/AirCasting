require 'rails_helper'

describe Setup::SourceStreamConfigurationInitializer do
  subject { described_class.new }

  describe '#call' do
    it 'creates source, stream configurations, and source-stream configuration associations' do
      expect { subject.call }.to change(Source, :count).by(1).and change(
                        StreamConfiguration,
                        :count,
                      ).by(5).and change(SourceStreamConfiguration, :count).by(
                                        2,
                                      )
    end

    it 'does not duplicate data' do
      create(:source, name: 'EEA')

      expect { subject.call }.not_to change(Source, :count)
    end
  end
end
