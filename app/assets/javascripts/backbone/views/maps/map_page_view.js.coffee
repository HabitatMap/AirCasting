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
AirCasting.Views.Maps ||= {}

class AirCasting.Views.Maps.MapPageView extends Backbone.View
  initialize: (options) ->
    @checkForIE()
    @googleMap = new AirCasting.GoogleMap()
    @hud = new AirCasting.Views.Maps.HudTabs(el: $('#right-hud'), googleMap: @googleMap, sessionId: options?.sessionId, mapState: options?.mapState)
    @hud.render()

  checkForIE: ->
    if $.browser.msie and !$.cookie('no-ie-closed')
      box = '<div class="no-ie">This site is not optimized for Internet Explorer browsers. Enter at your own risk. <a href="#">Close</a></div>'
      $('body').append(box)
      $('.no-ie a').click (e) =>
        $('.no-ie').slideUp()
        $.cookie('no-ie-closed', true, expires: 365)
        return false
