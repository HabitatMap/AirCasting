describe "Sessions", ->
  beforeEach ->
    @all_sensor = new AirCasting.Models.Sensor(sensor_name: "All", measurement_type: "All")
    @a_sensor = new AirCasting.Models.Sensor(sensor_name: "a", measurement_type: "a")
    @collection = new AirCasting.Collections.SessionsCollection()
    @streams = [
      {measurement_type: "a", sensor_name: "b"},
      {measurement_type: "a", sensor_name: "a"},
      {measurement_type: "b", sensor_name: "b"}
    ]
    @sessions = [
      new AirCasting.Models.Session(title: "a", streams: [@streams[0]]),
      new AirCasting.Models.Session(title: "b", streams: [@streams[1]])
    ]
    @collection.add(@sessions[0])
    @collection.add(@sessions[1])

  it "should return all sessions when filtered by all_sensor", ->
    result = @collection.filterBySensor(@all_sensor)
    expect(result).toContain(@sessions[0])
    expect(result).toContain(@sessions[1])


  it "should return sessions containing sensor", ->
    result = @collection.filterBySensor(@a_sensor)

    @collection.filter

    expect(result).toContain(@sessions[1])
    expect(result).toNotContain(@sessions[0])
