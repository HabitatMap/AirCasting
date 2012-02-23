require 'spec_helper'

describe RegionInfo do
  before { Measurement.destroy_all }

  let!(:m1) { Factory(:measurement, :latitude => 10, :longitude => 20, :value => 10) }
  let!(:m2) { Factory(:measurement, :latitude => 10, :longitude => 20, :value => 20) }
  let!(:m3) { Factory(:measurement, :latitude => 20, :longitude => 20, :value => 30) }

  subject { RegionInfo.new(:south => 5, :north => 15, :west => 15, :east => 25) }

  its(:average) { should == Measurement.joins(:session).where(:id => [m1.id, m2.id]).average(Measurement::CALIBRATE) }
  its(:top_contributors) { should include m1.session.user.username }
  its(:top_contributors) { should_not include m3.session.user.username }
  its(:number_of_contributors) { should == 2 }
end
