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

# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :fixed_session do
    user
    sequence(:uuid) { |n| "uuid-#{n}" }
    title { "Another session" }
    tag_list { "boring quiet" }
    contribute { true }
    notes_attributes { [FactoryBot.attributes_for(:note, :session => nil)] }
    start_time {Time.now}
    end_time {Time.now + 1.minute}
    start_time_local {Time.now}
    end_time_local {Time.now + 1.minute}
    is_indoor { false }
    latitude { 11.12 }
    longitude { 50.1234 }
  end
end
