require 'swagger_helper'

# The two share links the API hands out as `share_url`. Documented as routes,
# because a `share_url` field can say "append `?sensor_name=`" and still leave a
# client guessing what the route answers when it does not.
RSpec.describe 'Share links (web)', type: :request do
  # A local, not a constant: a constant assigned inside this block lands on
  # Object.
  share_link_desc = <<~DESC
    Opens one stream of a shared item on the web map, as a `302`. This is what
    the `share_url` fields point at — follow one in a browser rather than
    parsing its target, whose query string is internal.

    **`sensor_name` is required.** The map shows one stream at a time, so the
    link has to name which. Use a value the item itself reported, from its
    `streams[].sensor_name`.

    **A bare token with no query string does not reach this route.** It falls
    through to the single-page app, which answers `200` with the map's HTML —
    looks like success, selects nothing.
  DESC

  path '/s/{url_token}' do
    get 'Open a shared AirBeam session on the web map' do
      tags 'Web app: Export & sharing'
      produces 'application/json'
      security []
      description share_link_desc

      parameter name: :url_token, in: :path, required: true,
                schema: { type: :string }, example: 'ab12c',
                description: 'The token embedded in a session `share_url`'
      parameter name: :sensor_name, in: :query, required: true,
                schema: { type: :string }, example: 'AirBeamMini-PM2.5',
                description: 'Which stream of the session to open'

      response '302', 'redirect to the web map, opened on that stream' do
        header 'Location', schema: { type: :string },
               description: 'The web map URL, with the stream and its thresholds'

        let(:session) { create(:fixed_session) }
        let!(:stream) { create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5') }
        let(:url_token) { session.url_token }
        let(:sensor_name) { 'AirBeamMini-PM2.5' }

        run_test! { |response| expect(response.headers['Location']).to include('sensorName') }
      end

      response '400', '`sensor_name` missing' do
        schema type: :object,
               additionalProperties: { type: :array, items: { type: :string } },
               example: { sensor_name: ['is missing'] }

        let(:session) { create(:fixed_session) }
        let!(:stream) { create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5') }
        let(:url_token) { session.url_token }
        let(:sensor_name) { '' }

        run_test!
      end

      response '404', 'no such token, or the session has no such stream' do
        schema type: :string, example: '404 Not Found'

        let(:url_token) { 'nope1' }
        let(:sensor_name) { 'AirBeamMini-PM2.5' }

        run_test!
      end
    end
  end

  path '/g/{url_token}' do
    get 'Open a shared government station on the web map' do
      tags 'Web app: Export & sharing'
      produces 'application/json'
      security []
      description share_link_desc + <<~DESC

        A separate namespace from `/s/` on purpose: the two kinds of token are
        drawn from the same alphabet and may collide, so the path segment is
        what says which kind this one is. A government `sensor_name` is
        `Government-<measurement type>`, matched case-insensitively.
      DESC

      parameter name: :url_token, in: :path, required: true,
                schema: { type: :string }, example: 'ab3k9',
                description: 'The token embedded in a station `share_url`'
      parameter name: :sensor_name, in: :query, required: true,
                schema: { type: :string }, example: 'Government-PM2.5',
                description: 'Which stream of the station to open'

      let(:source) { create(:source, name: 'EPA', full_name: 'US EPA AirNow') }
      let(:station) { create(:station, source: source, url_token: 'ab3k9') }
      let!(:station_stream) do
        create(
          :station_stream,
          source: source,
          station: station,
          stream_configuration: create(:stream_configuration, measurement_type: 'PM2.5'),
          location: station.location,
        )
      end

      response '302', 'redirect to the web map, opened on that stream' do
        header 'Location', schema: { type: :string },
               description: 'The web map URL, with the stream and its thresholds'

        let(:url_token) { 'ab3k9' }
        let(:sensor_name) { 'Government-PM2.5' }

        run_test! { |response| expect(response.headers['Location']).to include('sensorName') }
      end

      response '400', '`sensor_name` missing' do
        schema type: :object,
               additionalProperties: { type: :array, items: { type: :string } },
               example: { sensor_name: ['is missing'] }

        let(:url_token) { 'ab3k9' }
        let(:sensor_name) { '' }

        run_test!
      end

      # A station we hold but do not publish is not distinguishable from one we
      # do not have. Nothing useful a client could do with the difference.
      response '404', 'no such token, or the station has no such stream' do
        schema type: :string, example: '404 Not Found'

        let(:url_token) { 'nope1' }
        let(:sensor_name) { 'Government-PM2.5' }

        run_test!
      end
    end
  end
end
