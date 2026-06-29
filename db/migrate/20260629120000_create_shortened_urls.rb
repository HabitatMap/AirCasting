class CreateShortenedUrls < ActiveRecord::Migration[7.0]
  def change
    create_table :shortened_urls do |t|
      t.string :slug, null: false
      t.text :long_url, null: false
      t.string :url_hash, null: false # SHA256 hex of long_url, used for dedup
      t.integer :click_count, null: false, default: 0
      t.timestamps
    end

    add_index :shortened_urls, :slug, unique: true
    add_index :shortened_urls, :url_hash, unique: true
  end
end
