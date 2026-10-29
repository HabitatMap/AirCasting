require 'rails_helper'

describe 'GET /api/v3/threshold_sets' do
  let(:set_keys) do
    %w[sensor_name measurement_type unit_symbol aliases thresholds]
  end

  def get_sets
    get '/api/v3/threshold_sets'
    JSON.parse(response.body)['threshold_sets']
  end

  def find(sets, sensor_name)
    sets.find { |set| set['sensor_name'] == sensor_name }
  end

  before { create_default_threshold_sets }

  it 'needs no authentication' do
    get '/api/v3/threshold_sets'

    expect(response.status).to eq(200)
  end

  it 'returns one entry per measurement parameter' do
    expect(get_sets.map { |set| set['sensor_name'] }).to contain_exactly(
      'AirBeam-PM1',
      'AirBeam-PM2.5',
      'AirBeam-PM10',
      'AirBeam-RH',
      'AirBeam-F',
      'Phone Microphone',
      'Government-NO2',
      'Government-Ozone',
    )
  end

  it 'returns every documented key on every entry' do
    get_sets.each { |set| expect(set.keys).to match_array(set_keys) }
  end

  it 'serves bands as numbers, not the stringified integers of /api/thresholds' do
    thresholds = find(get_sets, 'AirBeam-PM2.5')['thresholds']

    expect(thresholds).to eq(
      'very_low' => 0.0, 'low' => 9.0, 'medium' => 35.0,
      'high' => 55.0, 'very_high' => 150.0
    )
  end

  it 'reads government bands from stream_configurations' do
    expect(find(get_sets, 'Government-NO2')).to include(
      'measurement_type' => 'Nitrogen Dioxide',
      'unit_symbol' => 'ppb',
      'thresholds' => {
        'very_low' => 0.0, 'low' => 53.0, 'medium' => 100.0,
        'high' => 360.0, 'very_high' => 649.0
      },
    )
  end

  it 'ignores the non-canonical government configurations' do
    create(
      :stream_configuration,
      measurement_type: 'NO2', unit_symbol: 'µg/m³', canonical: false,
      threshold_very_low: 0, threshold_low: 100, threshold_medium: 188,
      threshold_high: 677, threshold_very_high: 1220,
    )

    expect(find(get_sets, 'Government-NO2')['unit_symbol']).to eq('ppb')
  end

  describe 'aliases' do
    it 'lists every device spelling that resolves to the entry' do
      expect(find(get_sets, 'AirBeam-PM10')['aliases']).to contain_exactly(
        'AirBeam-PM10', 'AirBeam2-PM10', 'AirBeam3-PM10', 'AirBeamMini-PM10'
      )
    end

    it 'covers every name a stream can be stored under' do
      covered = get_sets.flat_map { |set| set['aliases'] }

      expect(covered).to include(*Sensor::CANONICAL_SENSOR_NAME_MAP.keys)
    end

    it 'always contains the entry\'s own sensor_name' do
      get_sets.each do |set|
        expect(set['aliases']).to include(set['sensor_name'])
      end
    end

    it 'folds government PM2.5 into the AirBeam PM2.5 entry' do
      expect(find(get_sets, 'AirBeam-PM2.5')['aliases'])
        .to include('Government-PM2.5')
    end
  end

  describe 'selection' do
    # Production has nineteen rows flagged default, including a second
    # AirBeam3-PM10 carrying sound-level bands and an AirBeam2-F carrying
    # humidity ones. Only canonical names are read, so none of that is visible.
    it 'ignores default-flagged rows under a non-canonical sensor name' do
      create(
        :threshold_set, :default,
        sensor_name: 'AirBeam3-PM10', unit_symbol: 'µg/m³',
        threshold_very_low: 20, threshold_low: 60, threshold_medium: 70,
        threshold_high: 80, threshold_very_high: 100,
      )

      expect(find(get_sets, 'AirBeam-PM10')['thresholds']['low']).to eq(20.0)
    end

    it 'prefers the flagged row over a user-supplied set of the same name' do
      create(
        :threshold_set,
        sensor_name: 'AirBeam-F', unit_symbol: 'F', is_default: false,
        threshold_very_low: 1, threshold_low: 2, threshold_medium: 3,
        threshold_high: 4, threshold_very_high: 5,
      )

      expect(find(get_sets, 'AirBeam-F')['thresholds']['very_low']).to eq(15.0)
    end

    it 'raises rather than serving a parameter it has no row for' do
      ThresholdSet.where(sensor_name: 'Phone Microphone').delete_all

      expect { ThresholdSets::Defaults.new.call }
        .to raise_error(ThresholdSets::Defaults::MissingDefault, /Phone Microphone/)
    end
  end

  # The two tables are edited independently and nothing stops them drifting.
  # If they ever disagree, one entry can no longer represent both and the
  # government PM2.5 alias has to become an entry of its own.
  it 'keeps the two PM2.5 sources in agreement' do
    airbeam = ThresholdSet.find_by!(sensor_name: 'AirBeam-PM2.5', is_default: true)
    government = StreamConfiguration.find_by!(measurement_type: 'PM2.5', canonical: true)

    %i[threshold_very_low threshold_low threshold_medium threshold_high
       threshold_very_high].each do |band|
      expect(airbeam.public_send(band)).to eq(government.public_send(band))
    end
  end

  it 'lets a client cache the response' do
    get '/api/v3/threshold_sets'

    expect(response.headers['Cache-Control']).to include('public', 'max-age=3600')
  end
end
