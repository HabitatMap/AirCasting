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

ActiveRecord::Schema.define(version: 2024_05_20_182602) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.bigint "byte_size", null: false
    t.string "checksum", null: false
    t.datetime "created_at", null: false
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "deleted_sessions", id: :serial, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "uuid"
    t.integer "user_id"
    t.index ["user_id"], name: "index_deleted_sessions_on_user_id"
    t.index ["uuid", "user_id"], name: "index_deleted_sessions_on_uuid_and_user_id"
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

  create_table "measurements", id: :serial, force: :cascade do |t|
    t.float "value"
    t.decimal "latitude", precision: 12, scale: 9
    t.decimal "longitude", precision: 12, scale: 9
    t.datetime "time"
    t.integer "timezone_offset"
    t.integer "stream_id"
    t.integer "milliseconds", default: 0
    t.float "measured_value"
    t.geometry "location", limit: {:srid=>4326, :type=>"geometry"}, null: false
    t.datetime "time_with_time_zone"
    t.index ["stream_id", "time"], name: "index_measurements_on_stream_id_and_time"
  end

  create_table "notes", id: :serial, force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "date"
    t.text "text"
    t.decimal "longitude", precision: 12, scale: 9
    t.decimal "latitude", precision: 12, scale: 9
    t.integer "session_id"
    t.string "photo_file_name"
    t.string "photo_content_type"
    t.integer "photo_file_size"
    t.datetime "photo_updated_at"
    t.integer "number"
    t.index ["session_id"], name: "index_notes_on_session_id"
  end

  create_table "sessions", id: :serial, force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer "user_id"
    t.string "uuid"
    t.string "url_token"
    t.text "title"
    t.boolean "contribute"
    t.datetime "start_time_local"
    t.datetime "end_time_local"
    t.string "type", null: false
    t.boolean "is_indoor"
    t.decimal "latitude", precision: 12, scale: 9
    t.decimal "longitude", precision: 12, scale: 9
    t.datetime "last_measurement_at"
    t.integer "version", default: 1
    t.string "time_zone", default: "UTC", null: false
    t.index ["contribute"], name: "index_sessions_on_contribute"
    t.index ["end_time_local"], name: "index_sessions_on_end_time_local"
    t.index ["last_measurement_at"], name: "index_sessions_on_last_measurement_at"
    t.index ["start_time_local"], name: "index_sessions_on_start_time_local"
    t.index ["url_token"], name: "index_sessions_on_url_token"
    t.index ["user_id"], name: "index_sessions_on_user_id"
    t.index ["uuid"], name: "index_sessions_on_uuid"
  end

  create_table "stream_daily_averages", force: :cascade do |t|
    t.bigint "stream_id", null: false
    t.float "value", null: false
    t.date "date", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["stream_id"], name: "index_stream_daily_averages_on_stream_id"
  end

  create_table "streams", id: :serial, force: :cascade do |t|
    t.string "sensor_name"
    t.string "unit_name"
    t.string "measurement_type"
    t.string "measurement_short_type"
    t.string "unit_symbol"
    t.integer "session_id"
    t.string "sensor_package_name", default: "Builtin", null: false
    t.integer "measurements_count", default: 0, null: false
    t.decimal "min_latitude", precision: 12, scale: 9
    t.decimal "max_latitude", precision: 12, scale: 9
    t.decimal "min_longitude", precision: 12, scale: 9
    t.decimal "max_longitude", precision: 12, scale: 9
    t.float "average_value"
    t.decimal "start_longitude", precision: 12, scale: 9
    t.decimal "start_latitude", precision: 12, scale: 9
    t.integer "threshold_set_id", null: false
    t.index ["max_latitude"], name: "index_streams_on_max_latitude"
    t.index ["max_longitude"], name: "index_streams_on_max_longitude"
    t.index ["min_latitude"], name: "index_streams_on_min_latitude"
    t.index ["min_longitude"], name: "index_streams_on_min_longitude"
    t.index ["sensor_name", "measurement_type"], name: "index_streams_on_sensor_name_and_measurement_type"
    t.index ["sensor_name"], name: "index_streams_on_sensor_name"
    t.index ["session_id"], name: "index_streams_on_session_id"
  end

  create_table "taggings", id: :serial, force: :cascade do |t|
    t.integer "tag_id"
    t.string "taggable_type"
    t.integer "taggable_id"
    t.string "tagger_type"
    t.integer "tagger_id"
    t.string "context"
    t.datetime "created_at"
    t.index ["context"], name: "index_taggings_on_context"
    t.index ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_idx", unique: true
    t.index ["tag_id"], name: "index_taggings_on_tag_id"
    t.index ["taggable_id", "taggable_type", "context"], name: "index_taggings_on_taggable_id_and_taggable_type_and_context"
    t.index ["taggable_id", "taggable_type", "tagger_id", "context"], name: "taggings_idy"
    t.index ["taggable_id"], name: "index_taggings_on_taggable_id"
    t.index ["taggable_type"], name: "index_taggings_on_taggable_type"
    t.index ["tagger_id", "tagger_type"], name: "index_taggings_on_tagger_id_and_tagger_type"
    t.index ["tagger_id"], name: "index_taggings_on_tagger_id"
  end

  create_table "tags", id: :serial, force: :cascade do |t|
    t.string "name"
    t.integer "taggings_count", default: 0
    t.index ["name"], name: "index_tags_on_name"
  end

  create_table "threshold_alerts", force: :cascade do |t|
    t.integer "user_id"
    t.string "session_uuid"
    t.string "sensor_name"
    t.float "threshold_value"
    t.integer "frequency"
    t.datetime "last_email_at"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "timezone_offset", default: 0
    t.index ["session_uuid", "sensor_name"], name: "index_threshold_alerts_on_session_uuid_and_sensor_name"
  end

  create_table "threshold_sets", force: :cascade do |t|
    t.string "sensor_name"
    t.string "unit_symbol"
    t.boolean "is_default"
    t.float "threshold_very_low"
    t.float "threshold_low"
    t.float "threshold_medium"
    t.float "threshold_high"
    t.float "threshold_very_high"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["sensor_name", "unit_symbol"], name: "index_threshold_sets_on_sensor_name_and_unit_symbol"
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", limit: 128, default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "authentication_token"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string "username"
    t.boolean "send_emails"
    t.boolean "admin", default: false
    t.boolean "session_stopped_alert", default: false
    t.string "deletion_confirmation_code"
    t.datetime "deletion_code_valid_until"
    t.index ["authentication_token"], name: "index_users_on_authentication_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "stream_daily_averages", "streams"
end
