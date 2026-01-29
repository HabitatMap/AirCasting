module Eea
  class Unzipper
    def initialize(
      repository: Repository.new,
      copy_worker: Eea::CopyRawMeasurementsWorker
    )
      @repository = repository
      @copy_worker = copy_worker
    end

    def call(batch_id:)
      batch = repository.find_ingest_batch(batch_id: batch_id)
      zip_path = Eea::FileStorage.zip_path(batch_id)
      dest_root = Eea::FileStorage.parquet_directory(batch_id)

      if invalid_zip?(zip_path)
        repository.update_ingest_batch_status!(batch: batch, status: :failed)

        return
      end

      extract_parquet_files(zip_path, dest_root)

      repository.update_ingest_batch_status!(batch: batch, status: :unzipped)
      copy_worker.perform_async(batch.id)
    end

    private

    attr_reader :repository, :copy_worker

    def invalid_zip?(zip_path)
      Zip::File.open(zip_path) { |zip| zip.glob('E2a/*.parquet').none? }
    rescue Zip::Error, Errno::ENOENT
      true
    end

    def extract_parquet_files(zip_path, dest_root)
      saved = []

      Zip::File.open(zip_path) do |zip|
        entries = zip.glob('E2a/*.parquet')
        entries.each do |entry|
          target = File.join(dest_root, File.basename(entry.name))
          FileUtils.mkdir_p(File.dirname(target))
          entry.extract(target) { true }
          saved << target
        end
      end
      saved
    end
  end
end
