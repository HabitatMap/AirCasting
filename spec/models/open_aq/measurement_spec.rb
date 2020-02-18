require 'rails_helper'

describe OpenAq::Stream do
  it 'converts ppm to ppb' do
    stream = build_open_aq_measurement(unit: 'ppm', value: 1)

    expect(stream.unit).to eq('ppb')
    expect(stream.value).to eq(1_000)
  end

  it 'does not convert µg/m³' do
    stream = build_open_aq_measurement(unit: 'µg/m³', value: 1)

    expect(stream.unit).to eq('µg/m³')
    expect(stream.value).to eq(1)
  end
end
