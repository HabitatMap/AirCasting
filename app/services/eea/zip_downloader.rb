module Eea
  class ZipDownloader
    ROOT_DIR = Rails.root.join('storage', 'eea').to_s

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
      return unless batch || batch.processing?

      ActiveRecord::Base.transaction do
        repository.update_ingest_batch_status!(
          batch: batch,
          status: :downloading,
        )
        dir = create_directory(batch.id)
        tmp_path = File.join(dir, 'raw.zip.partial')
        zip_path = File.join(dir, 'raw.zip')

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

        repository.update_ingest_batch_status!(
          batch: batch,
          status: :downloaded,
        )
      end

      unzip_worker.perform_async(batch.id)
    end

    private

    attr_reader :repository, :api_client, :unzip_worker

    def create_directory(batch_id)
      dir = File.join(ROOT_DIR, 'incoming', batch_id.to_s)
      FileUtils.mkdir_p(dir)

      dir
    end
  end
end
