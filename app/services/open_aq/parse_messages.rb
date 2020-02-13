class OpenAq::ParseMessages
  def call(messages:)
    messages.map do |notification|
      OpenAq::S3Object.new(
        bucket: bucket(notification),
        key: key(notification),
        region: region(notification)
      )
    end
  end

  private

  def bucket(notification)
    record(notification)['s3']['bucket']['name']
  end

  def key(notification)
    record(notification)['s3']['object']['key']
  end

  def region(notification)
    record(notification)['awsRegion']
  end

  def record(notification)
    JSON.parse(JSON.parse(notification)['Message'])['Records'][0]
  end
end
