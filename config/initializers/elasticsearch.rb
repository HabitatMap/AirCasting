begin
  Elastic::Measurement.create_index!
rescue Faraday::ConnectionFailed
  Rails.logger.warn "Cannot connect to ElasticSearch"
end
