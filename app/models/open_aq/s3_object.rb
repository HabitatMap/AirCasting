module OpenAq
  S3Object = Struct.new(:region, :bucket, :key, keyword_init: true)
end
