module ApplicationHelper
  def load_webpack_manifest
    JSON.parse(File.read('public/packs/manifest.json'))
  rescue Errno::ENOENT
    fail "The webpack manifest file does not exist." unless Rails.configuration.assets.compile
  end

  def webpack_manifest
    # Always get manifest.json on the fly in development mode
    return load_webpack_manifest if Rails.env.development?

    # Get cached manifest.json if available, else cache the manifest
    Rails.configuration.x.webpack.manifest || Rails.configuration.x.webpack.manifest = load_webpack_manifest
  end

  def webpack_asset_urls(asset_name, asset_type)
    webpack_manifest['entrypoints'][asset_name]['assets'][asset_type]
  end
end
