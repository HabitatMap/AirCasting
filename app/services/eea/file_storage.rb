module Eea
  module FileStorage
    ROOT_DIR = Rails.root.join('tmp', 'eea').to_s
    private_constant :ROOT_DIR

    module_function

    def batch_directory(batch_id)
      File.join(ROOT_DIR, batch_id.to_s)
    end

    def zip_path(batch_id)
      File.join(batch_directory(batch_id), 'raw.zip')
    end

    def partial_zip_path(batch_id)
      File.join(batch_directory(batch_id), 'raw.zip.partial')
    end

    def parquet_glob(batch_id)
      File.join(batch_directory(batch_id), 'E2a', '*.parquet')
    end

    def parquet_directory(batch_id)
      File.join(batch_directory(batch_id), 'E2a')
    end

    def ensure_batch_directory(batch_id)
      dir = batch_directory(batch_id)
      FileUtils.mkdir_p(dir)

      dir
    end
  end
end
