desc 'Migrate photos from Paperclip to Active Storage'
task migrate_photos_to_active_storage: :environment do
  Note
    .where.not(photo_file_name: nil)
    .find_each do |note|
      next if note.s3_photo.attached?

      if note.photo_exists?
        paperclip_path =
          File.join(Rails.root, 'public', note.photo.to_s.split('?').first)
        puts "Migrating photo for Note ID: #{note.id}"

        content_type = note.photo_content_type
        mime_type = Mime::Type.lookup(content_type)
        extension = mime_type.symbol.to_s
        filename = "photo_#{SecureRandom.hex(8)}.#{extension}"

        # Attach the file to Active Storage
        note.s3_photo.attach(
          io: File.open(paperclip_path),
          filename: filename,
          content_type: content_type,
        )

        puts "Successfully migrated photo for Note ID: #{note.id}"
      else
        puts "Photo not found for Note ID: #{note.id}, skipping..."
      end
    end

  puts 'Migration completed!'
end
