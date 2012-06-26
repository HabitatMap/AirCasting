require 'spec_helper'

describe "MultiController" do
  it "should be success on root" do
    visit '/'
    page.should have_content('AirCasting')
  end
end
