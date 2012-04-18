# AirCasting - Share your Air!
# Copyright (C) 2011-2012 HabitatMap, Inc.
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 
# You can contact the authors by email at <info@habitatmap.org>

require 'spec_helper'

shared_examples_for "action returning user as json" do
  it "returns user's id, email and auth token" do
    json_response.should have_key('id')
    json_response.should have_key('email')
    json_response.should have_key('authentication_token')
  end
end

describe Api::UsersController do
  describe "#show" do
    let(:user) { FactoryGirl.create(:user) }

    before do
      sign_in user
      get :show, :format => :json
    end

    it_should_behave_like 'action returning user as json'
  end

  describe "#create" do
    let!(:user) { FactoryGirl.build(:user) }
    let(:attrs) { { :lolz => "rotfl" } }

    before do
      User.should_receive(:new).with(attrs.stringify_keys).and_return(user)
      user.stub!(:save => success)

      post :create,
           :user => attrs,
           :format => :json
    end

    context 'when user creation succeeds' do
      let(:success) { true }

      it { should respond_with(:created) }

      it_should_behave_like 'action returning user as json'
    end

    context 'when user creation fails' do
      let(:success) { false }

      it { should respond_with(:unprocessable_entity) }
    end
  end

end
