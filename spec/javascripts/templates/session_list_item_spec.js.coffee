describe "SessionListItemTemplate", ->
  beforeEach ->
    @streams = {
      "a": {measurement_type: "a", sensor_name: "a", measurement_short_type: "a_short"},
      "b": {measurement_type: "b", sensor_name: "b", measurement_short_type: "b_short"}
    }
    @session = new AirCasting.Models.Session(title: "a", streams: {a: @streams.a})
    @rendered = JST["backbone/templates/maps/session_list_item"](session: @session, selected: true, timeframe: "something")

  it "should contain a sorted list of short measurement types", ->
    expect(@rendered).toContain("a")

