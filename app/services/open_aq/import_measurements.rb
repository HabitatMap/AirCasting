require 'aws-sdk-sqs'
require 'aws-sdk-s3'

module OpenAq
  SQS_REGION = 'us-east-1'
  QUEUE_NAME = A9n.open_aq_sqs_queue_name
  Message = Struct.new(:body, :receipt_handle, keyword_init: true)

  class ImportMeasurements
    def initialize(
      fetch_messages: OpenAq::FetchMessages.new,
      fetch_files: OpenAq::FetchFiles.new,
      save_measurements: SaveMeasurements.new(user: User.where(username: 'OpenAQ').first!),
      delete_messages: OpenAq::DeleteMessages.new
    )
      @fetch_messages = fetch_messages
      @fetch_files = fetch_files
      @save_measurements = save_measurements
      @delete_messages = delete_messages
    end

    def call
      messages = @fetch_messages.call
      s3_objects =
        OpenAq::ParseMessages.new.call(messages: messages.map(&:body))
      files = @fetch_files.call(s3_objects: s3_objects)
      measurements = OpenAq::ParseFiles.new.call(files: files)
      filtered = OpenAq::FilterMeasurements.new.call(measurements: measurements)
      streams = GroupByStream.new.call(measurements: filtered)
      @save_measurements.call(streams: streams)
      @delete_messages.call(receipt_handles: messages.map(&:receipt_handle))
    end
  end

  class FetchMessages
    def initialize(client: OpenAq::SqsClient.new)
      @client = client
    end

    def call
      @client
        .receive_message(max_number_of_messages: 1)
        .messages
        .map do |message|
          OpenAq::Message.new(
            body: message.body,
            receipt_handle: message.receipt_handle
          )
        end
    end
  end

  class DeleteMessages
    def initialize(client: OpenAq::SqsClient.new)
      @client = client
    end

    def call(receipt_handles:)
      receipt_handles.each do |receipt_handle|
        @client.delete_message(receipt_handle: receipt_handle)
      end
    end
  end

  class SqsClient
    def receive_message(max_number_of_messages:)
      client.receive_message(
        queue_url: queue_url,
        max_number_of_messages: max_number_of_messages
      )
    end

    def delete_message(receipt_handle:)
      client.delete_message(
        queue_url: queue_url,
        receipt_handle: receipt_handle
      )
    end

    private

    def client
      @client ||=
        Aws::SQS::Client.new(
          region: SQS_REGION,
          access_key_id: A9n.aws_access_key_id,
          secret_access_key: A9n.aws_secret_access_key
        )
    end

    def queue_url
      @queue_url ||= client.get_queue_url(queue_name: QUEUE_NAME).queue_url
    end
  end

  class FetchFiles
    def call(s3_objects:)
      s3_objects.map do |s3_object|
        Aws::S3::Client
          .new(
            region: s3_object.region,
            access_key_id: A9n.aws_access_key_id,
            secret_access_key: A9n.aws_secret_access_key
          )
          .get_object(bucket: s3_object.bucket, key: s3_object.key)
          .body
          .read
      end
    end
  end
end
