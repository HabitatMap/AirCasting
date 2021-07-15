require 'rails_helper'

describe OpenAq::ParseMessages do
  it 'parses messages into s3_objects' do
    s3_objects = [build_s3_object, build_s3_object]
    messages = s3_objects.map { |s3_object| build_message(s3_object) }

    actual = subject.call(messages: messages)

    expect(actual).to eq(s3_objects)
  end

  def build_s3_object
    OpenAq::S3Object.new(
      bucket: random_string,
      key: random_string,
      region: random_string
    )
  end

  def build_message(s3_object)
    message = {
      'Records': [
        {
          'awsRegion': "#{s3_object.region}",
          's3': {
            'bucket': {
              'name': "#{s3_object.bucket}"
            },
            'object': {
              'key': "#{s3_object.key}"
            }
          }
        }
      ]
    }.to_json

    { 'Message' => message }.to_json
  end
end
