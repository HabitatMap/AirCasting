# WIP

require 'rails_helper'
require './lib/session_builder'

describe SessionBuilder do
  let(:user) { create_user! }

  subject { SessionBuilder.new(session_data, [], user) }
  let(:session_data) do
    {
      is_indoor: false,
      uuid: '32B8C8C9-D0A2-46F4-8644-7E11B31CFDFF',
      tag_list: '',
      longitude: 19.9256620467129,
      start_time: '2024-05-23T13:58:33.000Z',
      title: 'Mic 123',
      notes: [],
      deleted: false,
      type: 'MobileSession',
      streams: {
        'Phone Microphone' => {
          measurement_type: 'Sound Level',
          threshold_high: 80,
          unit_name: 'decibels',
          threshold_very_high: 100,
          measurement_short_type: 'db',
          deleted: false,
          threshold_very_low: 20,
          measurements: [
            {
              longitude: 19.925760220380383,
              time: '2024-05-23T13:58:34.000Z',
              latitude: 50.0583582102866,
              milliseconds: 0,
              value: 20.86663818359375
            },
            {
              milliseconds: 0,
              value: 38.978153228759766,
              latitude: 50.0583582102866,
              longitude: 19.925760220380383,
              time: '2024-05-23T13:58:33.000Z'
            },
          ],
          sensor_package_name: 'Builtin',
          unit_symbol: 'dB',
          sensor_name: 'Phone Microphone',
          threshold_low: 60,
          threshold_medium: 70,
        },
      },
      version: 0,
      end_time: '2024-05-23T13:58:40.000Z',
      contribute: true,
      latitude: 50.058385349704686,
    }
  end

  it 'builds a session with streams and measurements' do
    subject.build!

    expect(Session.count).to eq(1)
    expect(Stream.count).to eq(1)
    expect(Measurement.count).to eq(2)
  end

end
