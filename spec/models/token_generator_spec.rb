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

require 'rails_helper'

describe TokenGenerator do
  describe '#generate' do
    it 'should generate token of given length' do
      [1, 3, 5, 7].each { |n| expect(subject.generate(n).size).to eq(n) }
    end
  end

  describe '#generate_unique' do
    let(:gen) { TokenGenerator.new }
    let(:length) { 5 }
    let(:uniq_verifier) { double }

    subject { gen.generate_unique(length) { uniq_verifier.verify } }

    before do
      expect(uniq_verifier).to receive(:verify).and_return(false, false, true)
    end

    describe '#size' do
      subject { super().size }
      it { is_expected.to eq(length + 2) }
    end
  end
end
