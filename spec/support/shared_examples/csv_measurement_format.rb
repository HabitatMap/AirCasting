require 'csv'

# Shared example that verifies a CSV string produced by an export service
# follows the standard AirCasting measurement format. Both session and
# station-stream exports must produce an identical heading structure.
#
# Usage — provide a `csv_rows` let in the including context:
#
#   it_behaves_like 'a CSV with standard AirCasting measurement format' do
#     let(:csv_rows) { CSV.parse(File.read(fixture_path)) }
#   end
shared_examples 'a CSV with standard AirCasting measurement format' do
  # csv_rows must be defined via `let` in the including context

  it 'has Sensor_Package_Name label in row 1 at the first data column' do
    expect(csv_rows[0][5]).to eq('Sensor_Package_Name')
  end

  it 'has Sensor_Name label in row 3' do
    expect(csv_rows[2][5]).to eq('Sensor_Name')
  end

  it 'has Measurement_Type label in row 5' do
    expect(csv_rows[4][5]).to eq('Measurement_Type')
  end

  it 'has Measurement_Units label in row 7' do
    expect(csv_rows[6][5]).to eq('Measurement_Units')
  end

  it 'has data column headers in row 9' do
    expect(csv_rows[8]).to eq(
      %w[ObjectID Session_Name Timestamp Latitude Longitude 1:Measurement_Value],
    )
  end
end
