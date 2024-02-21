# this test is connected to the PurpleAir::ImportMeasurements service, which is not used anymore

# require 'rails_helper'

# MEASUREMENTS_FIELDS = [
#   # [SENSOR_INDEX, LAST_SEEN, NAME, LATITUDE, LONGITUDE, VALUE]
#   [129_737, 1_641_478_965, 'HOPE-Jane', 36.604595, -82.14892, 27.9],
#   [
#     129_783,
#     1_641_478_950,
#     'MV Clean Air Ambassador @ Liberty Bell High School',
#     10.7,
#     48.442444,
#     -120.16977,
#   ],
#   [130_003, 1_641_478_967, 'Silicon Nati Outside', -36.74553, 141.94203, 0.0],
# ]

# describe PurpleAir::ImportMeasurements do
#   let!(:user) do
#     User.create!(
#       email: 'email@example.com',
#       password: '12345678',
#       password_confirmation: '12345678',
#       username: 'PurpleAir',
#     )
#   end

#   it 'imports all the fields into a measurement' do
#     time = Time.current.to_i
#     measurement_fields = [
#       129_737,
#       time,
#       'HOPE-Jane',
#       36.604595,
#       -82.14892,
#       27.9,
#     ]

#     # [SENSOR_INDEX, LAST_SEEN, NAME, LATITUDE, LONGITUDE, VALUE]

#     described_class.new(
#       fetch_measurements: -> { [measurement_fields] },
#       utc_to_local: ->(time, _lat, _lng) { time },
#     ).call

#     [
#       [:value, measurement_fields[5]],
#       [:latitude, measurement_fields[3]],
#       [:longitude, measurement_fields[4]],
#       [:time, Time.at(time)],
#       [:timezone_offset, nil],
#       [:milliseconds, 0],
#       [:measured_value, measurement_fields[5]],
#     ].each do |attribute, expected|
#       expect(Measurement.first.public_send(attribute)).to eq(expected)
#     end
#   end

#   it 'imports all the fields into a stream' do
#     time = Time.current.to_i
#     measurement_fields = [
#       129_737,
#       time,
#       'HOPE-Jane',
#       36.604595,
#       -82.14892,
#       27.9,
#     ]

#     # [SENSOR_INDEX, LAST_SEEN, NAME, LATITUDE, LONGITUDE, VALUE]

#     described_class.new(fetch_measurements: -> { [measurement_fields] }).call

#     [
#       [:sensor_name, 'PurpleAir-PM2.5'],
#       [:unit_name, 'microgram per cubic meter'],
#       [:measurement_type, 'Particulate Matter'],
#       [:measurement_short_type, 'PM'],
#       [:unit_symbol, 'µg/m³'],
#       [:threshold_very_low, 0],
#       [:threshold_low, 12],
#       [:threshold_medium, 35],
#       [:threshold_high, 55],
#       [:threshold_very_high, 150],
#       [:sensor_package_name, 'PurpleAir-PM2.5'],
#       [:min_latitude, measurement_fields[3]],
#       [:max_latitude, measurement_fields[3]],
#       [:min_longitude, measurement_fields[4]],
#       [:max_longitude, measurement_fields[4]],
#       [:start_latitude, measurement_fields[3]],
#       [:start_longitude, measurement_fields[4]],
#     ].each do |attribute, expected|
#       expect(Stream.first.public_send(attribute)).to eq(expected)
#     end
#   end

#   it 'imports all the fields into a session' do
#     time = Time.current.to_i
#     measurement_fields = [
#       129_737,
#       time,
#       'HOPE-Jane',
#       36.604595,
#       -82.14892,
#       27.9,
#     ]

#     # [SENSOR_INDEX, LAST_SEEN, NAME, LATITUDE, LONGITUDE, VALUE]

#     described_class.new(
#       fetch_measurements: -> { [measurement_fields] },
#       utc_to_local: ->(time, _lat, _lng) { time },
#     ).call

#     [
#       [:user_id, user.id],
#       [:title, "#{measurement_fields[2]} (#{measurement_fields[0]})"],
#       [:contribute, true],
#       [:start_time_local, Time.at(time)],
#       [:end_time_local, Time.at(time)],
#       [:last_measurement_at, Time.at(time)],
#       [:is_indoor, false],
#       [:latitude, measurement_fields[3]],
#       [:longitude, measurement_fields[4]],
#     ].each do |attribute, expected|
#       expect(Session.first.public_send(attribute)).to eq(expected)
#     end
#   end

#   it 'connects session <-> stream <-> measurement' do
#     described_class.new(fetch_measurements: -> { MEASUREMENTS_FIELDS.take(1) })
#       .call

#     expect(Measurement.first.stream).to eq(Stream.first)
#     expect(Stream.first.session).to eq(Session.first)
#     expect(Session.first.streams).to eq(Stream.all)
#     expect(Stream.first.measurements).to eq(Measurement.all)
#   end

#   it 'imports all measurements_fields' do
#     described_class.new(fetch_measurements: -> { MEASUREMENTS_FIELDS }).call

#     expect(Session.count).to eq(MEASUREMENTS_FIELDS.size)
#     expect(Stream.count).to eq(MEASUREMENTS_FIELDS.size)
#     expect(Stream.pluck(:measurements_count)).to eq(
#       [1] * MEASUREMENTS_FIELDS.size,
#     )
#     expect(Measurement.count).to eq(MEASUREMENTS_FIELDS.size)
#   end

#   it 'when measurements coordinates match it groups into one stream' do
#     latitude = 36.604595
#     longitude = -82.14892
#     measurements_fields = [
#       [129_737, 1_641_478_965, 'HOPE-Jane', latitude, longitude, 27.9],
#       [
#         129_783,
#         1_641_478_950,
#         'MV Clean Air Ambassador @ Liberty Bell High School',
#         latitude,
#         longitude,
#         10.7,
#       ],
#       # [SENSOR_INDEX, LAST_SEEN, NAME, LATITUDE, LONGITUDE, VALUE]
#     ]

#     described_class.new(fetch_measurements: -> { measurements_fields }).call

#     expect(Session.count).to eq(1)
#     expect(Stream.count).to eq(1)
#     expect(Stream.first.measurements_count).to eq(measurements_fields.size)
#     expect(Measurement.count).to eq(measurements_fields.size)
#   end

#   it 'when measurements coordinates match it appends to the stream' do
#     latitude = 36.604595
#     longitude = -82.14892
#     measurements_fields = [
#       [129_737, 1_641_478_965, 'HOPE-Jane', latitude, longitude, 27.9],
#       [
#         129_783,
#         1_641_478_950,
#         'MV Clean Air Ambassador @ Liberty Bell High School',
#         latitude,
#         longitude,
#         10.7,
#       ],
#       # [SENSOR_INDEX, LAST_SEEN, NAME, LATITUDE, LONGITUDE, VALUE]
#     ]

#     described_class.new(fetch_measurements: -> { measurements_fields.take(1) })
#       .call

#     expect(Session.count).to eq(1)
#     expect(Stream.count).to eq(1)
#     expect(Stream.first.measurements_count).to eq(1)
#     expect(Measurement.count).to eq(1)

#     described_class.new(fetch_measurements: -> { measurements_fields.drop(1) })
#       .call

#     expect(Session.count).to eq(1)
#     expect(Stream.count).to eq(1)
#     expect(Stream.first.measurements_count).to eq(measurements_fields.size)
#     expect(Measurement.count).to eq(measurements_fields.size)
#   end

#   it 'when measurements coordinates match it updates the session' do
#     start = Time.current.to_i
#     later = start + 10
#     latitude = 36.604595
#     longitude = -82.14892
#     sensor_index = 129_783
#     name_1 = 'MV Clean Air Ambassador @ Liberty Bell High School'
#     name_2 = 'HOPE-Jane'
#     measurements_fields = [
#       [sensor_index, start, name_1, latitude, longitude, start, 10.7],
#       [sensor_index, later, name_2, latitude, longitude, 27.9],
#       # [SENSOR_INDEX, LAST_SEEN, NAME, LATITUDE, LONGITUDE, VALUE]
#     ]

#     described_class.new(
#       fetch_measurements: -> { measurements_fields.take(1) },
#       utc_to_local: ->(time, _lat, _lng) { time },
#     ).call

#     expect(Session.pluck(:title)).to eq(["#{name_1} (#{sensor_index})"])
#     expect(Session.pluck(:start_time_local)).to eq([Time.at(start)])
#     expect(Session.pluck(:end_time_local)).to eq([Time.at(start)])
#     expect(Session.pluck(:last_measurement_at)).to eq([Time.at(start)])

#     described_class.new(
#       fetch_measurements: -> { measurements_fields.drop(1) },
#       utc_to_local: ->(time, _lat, _lng) { time },
#     ).call

#     expect(Session.pluck(:title)).to eq(["#{name_2} (#{sensor_index})"])
#     expect(Session.pluck(:start_time_local)).to eq([Time.at(start)])
#     expect(Session.pluck(:end_time_local)).to eq([Time.at(later)])
#     expect(Session.pluck(:last_measurement_at)).to eq([Time.at(later)])
#   end
# end
