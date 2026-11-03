module ApplicationHelper
  # public/packs is gitignored and written by webpack, so a fresh checkout has
  # no manifest until something builds one. The old rescue only raised when
  # `assets.compile` was false — which is production alone — so in test and
  # development it returned nil and every caller died on
  # `undefined method [] for nil` thirteen frames away from the cause.
  def load_webpack_manifest
    JSON.parse(File.read('public/packs/manifest.json'))
  rescue Errno::ENOENT
    raise 'public/packs/manifest.json does not exist. Run `yarn build:test` ' \
          'to write it, or `yarn dev`, which writes it on its way to serving it.'
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
