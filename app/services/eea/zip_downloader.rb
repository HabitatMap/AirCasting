module Eea
  class ZipDownloader
    def initialize(
      repository: Repository.new,
      api_client: ApiClient.new,
      unzip_worker: Eea::UnzipWorker
    )
      @repository = repository
      @api_client = api_client
      @unzip_worker = unzip_worker
    end

    def call(batch_id:)
      batch = repository.find_ingest_batch(batch_id: batch_id)

      Eea::FileStorage.ensure_batch_directory(batch.id)
      tmp_path = Eea::FileStorage.partial_zip_path(batch.id)
      zip_path = Eea::FileStorage.zip_path(batch.id)

      bytes =
        api_client.fetch_zip_bytes(
          country: batch.country,
          pollutant: batch.pollutant,
          window_starts_at: batch.window_starts_at,
          window_ends_at: batch.window_ends_at,
        )

      File.open(tmp_path, 'wb') do |f|
        f.write(bytes)
        f.flush
        f.fsync
      end
      FileUtils.mv(tmp_path, zip_path, force: true)

      repository.update_ingest_batch_status!(batch: batch, status: :downloaded)

      unzip_worker.perform_async(batch.id)
    end

    private

    attr_reader :repository, :api_client, :unzip_worker
  end
end
