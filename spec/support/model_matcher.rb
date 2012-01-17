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

RSpec::Matchers.define :have_same_attributes_as do |expected|
  def clean(attributes)
    ignored = ["id", "updated_at", "created_at"]
    attributes.except(*ignored)
  end

  match do |actual|
    if actual.respond_to?(:each)
      actual.size == expected.size &&
        actual.zip(expected).all? { |x, y| clean(x.attributes) == clean(y.attributes) }
    else
      clean(actual.attributes) == clean(expected.attributes)
    end
  end

  description do
    "should have proper attributes"
  end

  failure_message_for_should do |actual|
    "expected\n\t#{actual.inspect}\n\nto have the same attribues as\n\t#{expected.inspect}"
  end

  failure_message_for_should_not do |actual|
    "expected\n\t#{actual.inspect}\n\tto have different attributes from\n\t#{expected.inspect}"
  end
end
