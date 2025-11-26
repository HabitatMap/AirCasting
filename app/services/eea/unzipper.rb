module Eea
  class Unzipper
    ROOT_DIR = Rails.root.join('storage', 'eea').to_s

    def initialize(
      repository: Repository.new,
      copy_worker: Eea::CopyRawMeasurementsWorker
    )
      @repository = repository
      @copy_worker = copy_worker
    end

    def call(batch_id:)
      batch = repository.find_ingest_batch(batch_id: batch_id)
      dir = File.join(ROOT_DIR, 'incoming', batch_id.to_s)
      zip_path = File.join(dir, 'raw.zip')
      dest_root = File.join(dir, 'E2a')

      extract_parquet_files(zip_path, dest_root)
      copy_worker.perform_async(batch.id)
    end

    private

    attr_reader :repository, :copy_worker

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
