require 'spec_helper'

describe RegionInfo do
  before do
    pending "RegionInfo working a different way now"
    Measurement.destroy_all
  end

  let!(:m1) { FactoryGirl.create(:measurement, :latitude => 10, :longitude => 20, :value => 10) }
  let!(:m2) { FactoryGirl.create(:measurement, :latitude => 10, :longitude => 20, :value => 20) }
  let!(:m3) { FactoryGirl.create(:measurement, :latitude => 20, :longitude => 20, :value => 30) }

  subject { RegionInfo.new(:south => 5, :north => 15, :west => 15, :east => 25) }

  its(:average) { should == Measurement.joins(:session).where(:id => relevant_measurements.map(&:id)).average(:value) }
  its(:number_of_samples) { should == 2 }
  its(:top_contributors) { should include m1.session.user.username }
  its(:top_contributors) { should_not include m3.session.user.username }
  its(:number_of_contributors) { should == 2 }

  let(:relevant_measurements) {[m1, m2]}

  describe "#as_json" do
    let(:data) { { :average => 1, :averages => {"LHC"=>20}, :number_of_samples => 2, :number_of_contributors => 3,
    :top_contributors => "joe", :number_of_contributors_per_sensor => 2, :number_of_samples_per_sensor => 2,
    :top_contributors_per_sensor => relevant_measurements.map{|m| m.user.login } } }

    before { subject.stub!(data) }

    it "should include the relevant data" do
      subject.as_json.should == data
    end
  end
end
