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

describe TokenGenerator do

  describe '#generate' do
    it 'should generate token of given length' do
      [1, 3, 5, 7].each do |n|
        subject.generate(n).should have(n).items
      end
    end
  end

  describe '#generate_unique' do
    let(:gen) { TokenGenerator.new }
    let(:length) { 5 }
    let(:uniq_verifier) { mock }

    subject do
      gen.generate_unique(length) do
        uniq_verifier.verify
      end
    end

    before do
      uniq_verifier.should_receive(:verify).and_return(false, false, true)
    end

    its(:size) { should == length + 2 }
  end

end
