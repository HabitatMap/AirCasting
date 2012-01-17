###
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
###
class AirCasting.Models.Session extends Backbone.Model
  # paramRoot: 'session'
  
  startTime: ->
    AC.util.parseTime @get('start_time')

  endTime: ->
    AC.util.parseTime @get('end_time')

  timeframe: ->
    if @startTime()?
      @startTime().toString('MM/dd/yy, HH:mm') + ' - ' + @endTime().toString('HH:mm')
    else
      ''

class AirCasting.Collections.SessionsCollection extends Backbone.Collection
  model: AirCasting.Models.Session

  setUrlParams: (timeFrom, timeTo, dayFrom, dayTo, includeSessionId, tags, usernames, location, distance, viewport) ->
    @timeFrom = timeFrom
    @timeTo = timeTo
    @dayFrom = dayFrom
    @dayTo = dayTo
    @includeSessionId = includeSessionId
    @tags = tags
    @usernames = usernames
    @location = location
    @distance = distance
    @viewport = viewport

  comparator: (session) ->
    - session.startTime().valueOf()

  fetch: ->
    [timeFrom, timeTo] = AC.util.normalizeTimeSpan(@timeFrom, @timeTo)
    @url = "/api/sessions.json?" +
      "q[time_from]=#{timeFrom}&q[time_to]=#{timeTo}&" +
      "q[day_from]=#{@dayFrom}&q[day_to]=#{@dayTo}&" +
      "q[tags]=#{@tags}&" +
      "q[usernames]=#{@usernames}&" +
      "q[include_session_id]=#{@includeSessionId}&" +
      "q[location]=#{@location}&" +
      "q[distance]=#{@distance}"

    if @viewport
      @url += "&q[east]=#{@viewport.east}&" +
        "q[west]=#{@viewport.west}&" +
        "q[south]=#{@viewport.south}&" +
        "q[north]=#{@viewport.north}"

    super()
