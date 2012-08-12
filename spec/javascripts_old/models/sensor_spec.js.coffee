describe "Sensors", ->
	beforeEach ->
		@collection = new AirCasting.Collections.SensorCollection()
		@sensors = [
			new AirCasting.Models.Sensor({sensor_name: "LHC", measurement_type: "hadrons"})
			new AirCasting.Models.Sensor({sensor_name: "ZZZ", measurement_type: "hadrons"})
			new AirCasting.Models.Sensor({sensor_name: "LMAO", measurement_type: "rotfls"})			
		]

	it "should be sorted by measurement type", ->		
		@collection.add(@sensors[2])
		@collection.add(@sensors[1])

		expect(@collection.at(0)).toEqual(@sensors[1])
		expect(@collection.at(1)).toEqual(@sensors[2])


	it "should be sorted by sensor_name if measurement_type is the same", ->		
		@collection.add(@sensors[0])
		@collection.add(@sensors[1])

		expect(@collection.at(0)).toEqual(@sensors[0])
		expect(@collection.at(1)).toEqual(@sensors[1])
