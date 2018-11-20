require 'spec_helper'

describe "MultiController" do
  it "should be success on root" do
    visit '/'
    expect(page).to have_content('AirCasting')
  end
end
