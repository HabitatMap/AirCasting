describe "Sessions", ->
  beforeEach ->
    @all_sensor = new AirCasting.Models.Sensor(sensor_name: "All", measurement_type: "All")
    @a_sensor = new AirCasting.Models.Sensor(sensor_name: "a", measurement_type: "a")
    @sessionsCollection = new AirCasting.Collections.SessionsCollection()
    @streams = {
      "a": {measurement_type: "a", sensor_name: "a"},
      "b": {measurement_type: "b", sensor_name: "b"}
    }
    @sessions = [
      new AirCasting.Models.Session(title: "a", streams: {a: @streams.a}),
      new AirCasting.Models.Session(title: "b", streams: {"b": @streams.b})
    ]
    @sessionsCollection.add(@sessions[0])
    @sessionsCollection.add(@sessions[1])

  it "should return all sessions when filtered by all_sensor", ->
    result = @sessionsCollection.filterBySensor(@all_sensor)
    expect(result).toContain(@sessions[0])
    expect(result).toContain(@sessions[1])


  it "should return sessions containing sensor", ->
    result = @sessionsCollection.filterBySensor(@a_sensor)
    @sessionsCollection.filter

    expect(result).toContain(@sessions[0])
    expect(result).toNotContain(@sessions[1])
