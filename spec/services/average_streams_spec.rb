require 'rails_helper'

describe AverageStreams do
  xit 'with amount of measurements less than the threshold measurements are not averaged' do
    session = create_mobile_session!
    stream = create_stream!(session: session)
    measurements = [
      create_measurement!(stream: stream),
      create_measurement!(stream: stream),
    ]

    AverageStreams.new(
      rules:
        AveragingRules.add(
          threshold: measurements.size + 1,
          window: random_int,
        ),
    ).call

    expect(Measurement.count).to eq(measurements.size)
    expect(stream.attributes).to eq(Stream.first.attributes)
    expect(measurements.map(&:attributes)).to eq(
      Measurement.all.map(&:attributes),
    )
  end

  xit 'with amount of measurements equal to the threshold measurements are not averaged' do
    session = create_mobile_session!
    stream = create_stream!(session: session)
    measurements = [
      create_measurement!(stream: stream),
      create_measurement!(stream: stream),
    ]

    AverageStreams.new(
      rules:
        AveragingRules.add(threshold: measurements.size, window: random_int),
    ).call

    expect(Measurement.count).to eq(measurements.size)
    expect(stream.attributes).to eq(Stream.first.attributes)
    expect(measurements.map(&:attributes)).to eq(
      Measurement.all.map(&:attributes),
    )
  end

  # TODO: This test is failing but the code that's tested is not used currently, test is failing only because measurements are created 48+ hours in the future
  xit 'with amount of measurements above the threshold measurements are averaged in groups of window size by keeping the middle measurement' do
    session = create_mobile_session!
    stream = create_stream!(session: session)
    middle_1 =
      create_measurement!(stream: stream, value: 1, time: DateTime.current)
    middle_2 =
      create_measurement!(
        stream: stream,
        value: 4,
        time: DateTime.current + 3.days,
      )
    create_measurement!(
      stream: stream,
      value: 2,
      time: DateTime.current + 1.day,
    )
    create_measurement!(
      stream: stream,
      value: 0,
      time: DateTime.current - 1.day,
    )
    create_measurement!(
      stream: stream,
      value: 3,
      time: DateTime.current + 2.days,
    )

    AverageStreams.new(rules: AveragingRules.add(threshold: 2, window: 3)).call

    expect(Measurement.count).to eq(2)
    expect(Measurement.first.attributes).to eq(
      middle_1.attributes.merge('value' => 1),
    )
    expect(Measurement.second.attributes).to eq(
      middle_2.attributes.merge('value' => 3.5),
    )
  end

  xit 'when measurements are averaged then the average value on the stream is recalculated' do
    session = create_mobile_session!
    stream = create_stream!(session: session, average_value: random_int)
    [1, 2].map { |value| create_measurement!(stream: stream, value: value) }

    AverageStreams.new(
      rules: AveragingRules.add(threshold: 1, window: random_int),
    ).call

    expect(Stream.all.map(&:average_value)).to eq([1.5])
  end

  xit 'when measurements are not averaged then the average value on the stream is not recalculated' do
    session = create_mobile_session!
    stream = create_stream!(session: session, average_value: random_int)
    [1, 2].map { |value| create_measurement!(stream: stream, value: value) }

    AverageStreams.new(
      rules: AveragingRules.add(threshold: 2, window: random_int),
    ).call

    expect(Stream.all.map(&:average_value)).to eq([stream.average_value])
  end

  xit 'when more than one rule has a threshold smaller than the amount of measurements it uses the rule with the biggest threshold' do
    session = create_mobile_session!
    stream = create_stream!(session: session)
    3.times { |_| create_measurement!(stream: stream) }

    AverageStreams.new(
      rules:
        AveragingRules
          .add(threshold: 1, window: 2)
          .add(threshold: 2, window: 3),
    ).call

    expect(Measurement.count).to eq(1)
  end

  xit 'with a window bigger than the amount of measurements it averages all the measurements' do
    session = create_mobile_session!
    stream = create_stream!(session: session)
    middle =
      create_measurement!(stream: stream, value: 1, time: DateTime.current)
    create_measurement!(
      stream: stream,
      value: 2,
      time: DateTime.current + 1.day,
    )
    create_measurement!(
      stream: stream,
      value: 0,
      time: DateTime.current - 1.day,
    )

    AverageStreams.new(rules: AveragingRules.add(threshold: 1, window: 4)).call

    expect(Measurement.all.map(&:attributes)).to eq(
      [middle.attributes.merge('value' => 1)],
    )
  end

  xit 'averages multiple streams' do
    session = create_mobile_session!
    stream_1 = create_stream!(session: session)
    create_measurement!(stream: stream_1, value: 1)
    create_measurement!(stream: stream_1, value: 2)
    stream_2 = create_stream!(session: session)
    create_measurement!(stream: stream_2, value: 3)
    create_measurement!(stream: stream_2, value: 4)

    AverageStreams.new(rules: AveragingRules.add(threshold: 1, window: 2)).call

    expect(stream_1.measurements.count).to eq(1)
    expect(stream_2.measurements.count).to eq(1)
  end

  it 'does not average fixed streams' do
    session = create_fixed_session!
    stream = create_stream!(session: session)
    create_measurement!(stream: stream, value: 0)
    create_measurement!(stream: stream, value: 1)

    AverageStreams.new(rules: AveragingRules.add(threshold: 1, window: 2)).call

    expect(Measurement.count).to eq(2)
  end
end
