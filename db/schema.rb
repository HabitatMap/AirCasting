# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2023_12_19_084743) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", id: :bigint, default: nil, force: :cascade do |t|
    t.string "name", limit: 255, null: false
    t.string "record_type", limit: 255, null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "active_storage_attachments_blob_id_idx"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "active_storage_attachmentse45ac-f35e-48f1-99ec-500f215fac03_idx", unique: true
  end

  create_table "active_storage_blobs", id: :bigint, default: nil, force: :cascade do |t|
    t.string "key", limit: 255, null: false
    t.string "filename", limit: 255, null: false
    t.string "content_type", limit: 255
    t.text "metadata"
    t.bigint "byte_size", null: false
    t.string "checksum", limit: 255, null: false
    t.datetime "created_at", null: false
    t.string "service_name", limit: 255, null: false
    t.index ["key"], name: "active_storage_blobs_key_idx", unique: true
  end

  create_table "active_storage_variant_records", id: :bigint, default: nil, force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", limit: 255, null: false
    t.index ["blob_id", "variation_digest"], name: "active_storage_variant_records_blob_id_variation_digest_idx", unique: true
  end

  create_table "deleted_sessions", id: :integer, default: nil, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "uuid", limit: 255
    t.integer "user_id"
    t.index ["user_id"], name: "deleted_sessions_user_id_idx"
    t.index ["uuid", "user_id"], name: "deleted_sessions_uuid_user_id_idx"
  end

  create_table "flipper_features", force: :cascade do |t|
    t.string "key", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["key"], name: "index_flipper_features_on_key", unique: true
  end

  create_table "flipper_gates", force: :cascade do |t|
    t.string "feature_key", null: false
    t.string "key", null: false
    t.text "value"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["feature_key", "key", "value"], name: "index_flipper_gates_on_feature_key_and_key_and_value", unique: true
  end

  create_table "measurements", id: :bigint, default: nil, force: :cascade do |t|
    t.float "value"
    t.decimal "latitude", precision: 12, scale: 9
    t.decimal "longitude", precision: 12, scale: 9
    t.datetime "time"
    t.integer "timezone_offset"
    t.integer "stream_id"
    t.integer "milliseconds", default: 0
    t.float "measured_value"
    t.index ["stream_id", "time"], name: "measurements_stream_id_time_idx"
    t.index ["stream_id"], name: "measurements_stream_id_idx"
  end

  create_table "notes", id: :integer, default: nil, force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "date"
    t.text "text"
    t.decimal "longitude", precision: 12, scale: 9
    t.decimal "latitude", precision: 12, scale: 9
    t.integer "session_id"
    t.string "photo_file_name", limit: 255
    t.string "photo_content_type", limit: 255
    t.integer "photo_file_size"
    t.datetime "photo_updated_at"
    t.integer "number"
    t.index ["session_id"], name: "notes_session_id_idx"
  end

  create_table "sessions", id: :integer, default: nil, force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer "user_id"
    t.string "uuid", limit: 255
    t.string "url_token", limit: 255
    t.text "title"
    t.boolean "contribute"
    t.datetime "start_time_local"
    t.datetime "end_time_local"
    t.string "type", limit: 255, null: false
    t.boolean "is_indoor"
    t.decimal "latitude", precision: 12, scale: 9
    t.decimal "longitude", precision: 12, scale: 9
    t.datetime "last_measurement_at"
    t.integer "version", default: 1
    t.index ["contribute"], name: "sessions_contribute_idx"
    t.index ["end_time_local"], name: "sessions_end_time_local_idx"
    t.index ["last_measurement_at"], name: "sessions_last_measurement_at_idx"
    t.index ["start_time_local"], name: "sessions_start_time_local_idx"
    t.index ["url_token"], name: "sessions_url_token_idx"
    t.index ["user_id"], name: "sessions_user_id_idx"
    t.index ["uuid"], name: "sessions_uuid_idx"
  end

  create_table "streams", id: :integer, default: nil, force: :cascade do |t|
    t.string "sensor_name", limit: 255
    t.string "unit_name", limit: 255
    t.string "measurement_type", limit: 255
    t.string "measurement_short_type", limit: 255
    t.string "unit_symbol", limit: 255
    t.integer "threshold_very_low"
    t.integer "threshold_low"
    t.integer "threshold_medium"
    t.integer "threshold_high"
    t.integer "threshold_very_high"
    t.integer "session_id"
    t.string "sensor_package_name", limit: 255, default: "Builtin", null: false
    t.integer "measurements_count", default: 0, null: false
    t.decimal "min_latitude", precision: 12, scale: 9
    t.decimal "max_latitude", precision: 12, scale: 9
    t.decimal "min_longitude", precision: 12, scale: 9
    t.decimal "max_longitude", precision: 12, scale: 9
    t.float "average_value"
    t.decimal "start_longitude", precision: 12, scale: 9
    t.decimal "start_latitude", precision: 12, scale: 9
    t.index ["max_latitude"], name: "streams_max_latitude_idx"
    t.index ["max_longitude"], name: "streams_max_longitude_idx"
    t.index ["min_latitude"], name: "streams_min_latitude_idx"
    t.index ["min_longitude"], name: "streams_min_longitude_idx"
    t.index ["sensor_name", "measurement_type"], name: "streams_sensor_name_measurement_type_idx"
    t.index ["sensor_name"], name: "streams_sensor_name_idx"
    t.index ["session_id"], name: "streams_session_id_idx"
  end

  create_table "taggings", id: :integer, default: nil, force: :cascade do |t|
    t.integer "tag_id"
    t.integer "taggable_id"
    t.string "taggable_type", limit: 255
    t.integer "tagger_id"
    t.string "tagger_type", limit: 255
    t.string "context", limit: 255
    t.datetime "created_at"
    t.index ["context"], name: "taggings_context_idx"
    t.index ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_tag_id_taggable_i125f9-ec61-4655-b017-96802f28909c_idx", unique: true
    t.index ["tag_id"], name: "taggings_tag_id_idx"
    t.index ["taggable_id", "taggable_type", "context"], name: "taggings_taggable_id_taggable_type_context_idx"
    t.index ["taggable_id", "taggable_type", "tagger_id", "context"], name: "taggings_taggable_id_taggable_type_tagger_id_context_idx"
    t.index ["taggable_id"], name: "taggings_taggable_id_idx"
    t.index ["taggable_type"], name: "taggings_taggable_type_idx"
    t.index ["tagger_id", "tagger_type"], name: "taggings_tagger_id_tagger_type_idx"
    t.index ["tagger_id"], name: "taggings_tagger_id_idx"
  end

  create_table "tags", id: :integer, default: nil, force: :cascade do |t|
    t.string "name", limit: 255
    t.integer "taggings_count", default: 0
    t.index ["name"], name: "tags_name_idx"
  end

  create_table "threshold_alerts", id: :bigint, default: nil, force: :cascade do |t|
    t.integer "user_id"
    t.string "session_uuid", limit: 255
    t.string "sensor_name", limit: 255
    t.float "threshold_value"
    t.integer "frequency"
    t.datetime "last_email_at"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "timezone_offset", default: 0
    t.index ["session_uuid", "sensor_name"], name: "threshold_alerts_session_uuid_sensor_name_idx"
  end

  create_table "users", id: :integer, default: nil, force: :cascade do |t|
    t.string "email", limit: 255, default: "", null: false
    t.string "encrypted_password", limit: 128, default: "", null: false
    t.string "reset_password_token", limit: 255
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip", limit: 255
    t.string "last_sign_in_ip", limit: 255
    t.string "authentication_token", limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string "username", limit: 255
    t.boolean "send_emails"
    t.boolean "admin", default: false
    t.boolean "session_stopped_alert", default: false
    t.index ["authentication_token"], name: "users_authentication_token_idx", unique: true
    t.index ["email"], name: "users_email_idx", unique: true
    t.index ["reset_password_token"], name: "users_reset_password_token_idx", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id", name: "active_storage_attachments_blob_id_fkey"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id", name: "active_storage_variant_records_blob_id_fkey"
end
