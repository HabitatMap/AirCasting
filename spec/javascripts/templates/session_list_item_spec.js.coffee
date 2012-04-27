describe "SessionListItemTemplate", ->
  beforeEach ->
    @session = {
      get: (key) -> {
        streams: [
          { measurement_short_type: "XX" }
          { measurement_short_type: "dB" }
        ]
      }[key]
    }
    @rendered = JST["backbone/templates/maps/session_list_item"](session: @session, selected: true, timeframe: "something")

  it "should contain a sorted list of short measurement types", ->
    expect(@rendered).toContain("dB/XX")

