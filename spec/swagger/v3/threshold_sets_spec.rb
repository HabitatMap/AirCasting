require 'swagger_helper'

# The default colour-scale bands, so a client ships none of its own.
#
# Constants live in a module rather than in the example group: a constant
# assigned inside `RSpec.describe` is defined on Object, which both warns on
# reload and lets two spec files silently overwrite each other's schema.
module ThresholdSetDocs
  BANDS = {
    type: :object,
    required: %w[very_low low medium high very_high],
    description:
      'Colour-scale bounds, ascending. Spelled exactly as the `thresholds` ' \
      'object that POST /api/v3/mobile_sessions and POST /api/v3/fixed_sessions ' \
      'accept, so a client offering threshold editing can send a modified set ' \
      'straight back.',
    properties: {
      very_low: { type: :number, format: :float, example: 0 },
      low: { type: :number, format: :float, example: 9 },
      medium: { type: :number, format: :float, example: 35 },
      high: { type: :number, format: :float, example: 55 },
      very_high: { type: :number, format: :float, example: 150 },
    },
  }.freeze

  SET = {
    type: :object,
    required: %w[sensor_name measurement_type unit_symbol aliases thresholds],
    properties: {
      sensor_name: {
        type: :string,
        description:
          'The canonical name for this parameter. Stable; use it as the key.',
        example: 'AirBeam-PM2.5',
      },
      measurement_type: {
        type: :string,
        description:
          'What is being measured. Not unique — PM1, PM2.5 and PM10 are all ' \
          '"Particulate Matter", which is why `sensor_name` is the key.',
        example: 'Particulate Matter',
      },
      unit_symbol: { type: :string, example: 'µg/m³' },
      aliases: {
        type: :array,
        items: { type: :string },
        description:
          'Every sensor name that resolves to this entry. A stream is stored ' \
          'under the raw name its device reports — `AirBeamMini-PM2.5` off the ' \
          'BLE line, `AirBeam2-PM2.5` from a followed session — so match an ' \
          'incoming name against this list rather than reimplementing the ' \
          'model-prefix rules. Always contains `sensor_name` itself.',
        example: %w[AirBeam-PM AirBeam-PM2.5 AirBeam2-PM2.5 AirBeam3-PM2.5
                    AirBeamMini-PM2.5 Government-PM2.5],
      },
      thresholds: BANDS,
    },
  }.freeze
end

RSpec.describe 'Mobile app — default threshold sets', type: :request do
  path '/api/v3/threshold_sets' do
    get 'Default threshold sets' do
      tags 'Mobile app: Thresholds'
      produces 'application/json'
      security []
      description <<~DESC
        The colour-scale bands for every measurement AirCasting serves. Read
        these instead of shipping a copy — the apps that hardcoded them had
        drifted apart from each other and from the server.

        One entry per measurement **parameter**, not per AirBeam model:
        `AirBeam3-PM2.5` and `AirBeamMini-PM2.5` are the same parameter and
        share one entry, listed under its `aliases`. Government parameters
        (`Government-NO2`, `Government-Ozone`) appear as entries of their own;
        government PM2.5 shares the `AirBeam-PM2.5` entry.

        These are also the bands the server assigns when a session is created
        without `thresholds` for a known sensor, so a client that omits them on
        upload and renders from this endpoint will always agree with the server.

        No authentication. Cacheable for an hour; the values change rarely.

        **Not what a user sees if they have edited their own bands** — a client
        storing per-user overrides keeps showing those. These are the defaults
        to seed from and to reset to.
      DESC

      response '200', 'default threshold sets' do
        schema type: :object,
               required: %w[threshold_sets],
               properties: {
                 threshold_sets: { type: :array, items: ThresholdSetDocs::SET },
               }

        before { create_default_threshold_sets }

        run_test! do |response|
          sets = JSON.parse(response.body)['threshold_sets']

          expect(sets.map { |set| set['sensor_name'] }).to eq(
            [
              'AirBeam-PM1',
              'AirBeam-PM2.5',
              'AirBeam-PM10',
              'AirBeam-RH',
              'AirBeam-F',
              'Phone Microphone',
              'Government-NO2',
              'Government-Ozone',
            ],
          )
        end
      end
    end
  end
end
