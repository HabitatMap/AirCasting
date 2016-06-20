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

# Read about factories at http://github.com/thoughtbot/factory_girl

FactoryGirl.define do
  factory :stream do
    sensor_name "LHC"
    sensor_package_name "CERN"
    unit_name "number"
    measurement_type "hadrons"
    measurement_short_type "hd"
    unit_symbol "#"
    threshold_very_low 1
    threshold_low 2
    threshold_medium 3
    threshold_high 4
    threshold_very_high 5
    association :session, factory: :mobile_session
  end
end
