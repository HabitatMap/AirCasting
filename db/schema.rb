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

ActiveRecord::Schema[7.0].define(version: 2026_01_14_160635) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", precision: nil, null: false
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
    t.datetime "created_at", precision: nil, null: false
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "deleted_sessions", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "uuid"
    t.integer "user_id"
    t.index ["user_id"], name: "index_deleted_sessions_on_user_id"
    t.index ["uuid", "user_id"], name: "index_deleted_sessions_on_uuid_and_user_id"
  end

  create_table "eea_ingest_batches", force: :cascade do |t|
    t.string "country", null: false
    t.string "pollutant", null: false
    t.timestamptz "window_starts_at", null: false
    t.timestamptz "window_ends_at", null: false
    t.string "status", default: "queued", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["country", "pollutant", "window_starts_at", "window_ends_at"], name: "idx_eea_ingest_batches_window_unique", unique: true
    t.index ["status"], name: "index_eea_ingest_batches_on_status"
    t.check_constraint "window_starts_at < window_ends_at", name: "chk_eea_ingest_batches_window_bounds"
  end

  create_table "eea_raw_measurements", id: false, force: :cascade do |t|
    t.bigint "eea_ingest_batch_id"
    t.string "samplingpoint"
    t.integer "pollutant"
    t.datetime "start_time", precision: nil
    t.datetime "end_time", precision: nil
    t.float "value"
    t.string "unit"
    t.integer "validity"
    t.integer "verification"
    t.timestamptz "ingested_at", default: -> { "now()" }, null: false
  end

  create_table "eea_transformed_measurements", force: :cascade do |t|
    t.bigint "eea_ingest_batch_id", null: false
    t.string "external_ref", null: false
    t.string "measurement_type", null: false
    t.timestamptz "measured_at", null: false
    t.float "value", null: false
    t.string "unit_symbol", null: false
    t.timestamptz "ingested_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["external_ref", "measurement_type", "measured_at"], name: "idx_eea_transformed_measurements_unique", unique: true
  end

  create_table "fixed_measurements", force: :cascade do |t|
    t.bigint "stream_id", null: false
    t.float "value", null: false
    t.datetime "time", precision: nil, null: false
    t.timestamptz "time_with_time_zone", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "fixed_stream_id"
    t.timestamptz "measured_at"
    t.index ["fixed_stream_id", "measured_at"], name: "idx_uniq_fixed_stream_measured_at_partial", unique: true, where: "((fixed_stream_id IS NOT NULL) AND (measured_at IS NOT NULL))"
    t.index ["stream_id", "time_with_time_zone"], name: "index_fixed_measurements_on_stream_id_and_time_with_time_zone", unique: true
    t.index ["stream_id"], name: "index_fixed_measurements_on_stream_id"
  end

  create_table "fixed_stream_measurements", force: :cascade do |t|
    t.bigint "fixed_stream_id", null: false
    t.timestamptz "measured_at", null: false
    t.float "value", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["fixed_stream_id", "measured_at"], name: "idx_fixed_measurements_stream_measured_at_uniq", unique: true
    t.index ["fixed_stream_id"], name: "index_fixed_stream_measurements_on_fixed_stream_id"
  end

  create_table "fixed_streams", force: :cascade do |t|
    t.bigint "source_id", null: false
    t.bigint "stream_configuration_id", null: false
    t.string "external_ref", null: false
    t.geometry "location", limit: {:srid=>4326, :type=>"geometry"}
    t.string "time_zone", null: false
    t.timestamptz "first_measured_at"
    t.timestamptz "last_measured_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "title", null: false
    t.string "url_token", null: false
    t.bigint "stream_id"
    t.index ["location"], name: "index_fixed_streams_on_location", using: :gist
    t.index ["source_id", "stream_configuration_id", "external_ref"], name: "idx_fixed_streams_src_ref_cfg_uniq", unique: true
    t.index ["source_id"], name: "index_fixed_streams_on_source_id"
    t.index ["stream_configuration_id"], name: "index_fixed_streams_on_stream_configuration_id"
    t.check_constraint "first_measured_at <= last_measured_at", name: "chk_stream_measured_bounds"
  end

  create_table "hourly_averages", force: :cascade do |t|
    t.bigint "fixed_stream_id", null: false
    t.integer "value", null: false
    t.datetime "measured_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["fixed_stream_id", "measured_at", "value"], name: "index_hourly_averages_on_fixed_stream_and_measured_at", unique: true
    t.index ["measured_at"], name: "index_hourly_averages_on_measured_at"
  end

  create_table "measurements", id: :serial, force: :cascade do |t|
    t.float "value"
    t.decimal "latitude", precision: 12, scale: 9
    t.decimal "longitude", precision: 12, scale: 9
    t.datetime "time", precision: nil
    t.integer "timezone_offset"
    t.integer "stream_id"
    t.integer "milliseconds", default: 0
    t.float "measured_value"
    t.geometry "location", limit: {:srid=>4326, :type=>"geometry"}, null: false
    t.timestamptz "time_with_time_zone"
    t.index ["stream_id", "time"], name: "index_measurements_on_stream_id_and_time"
  end

  create_table "notes", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil
    t.datetime "updated_at", precision: nil
    t.datetime "date", precision: nil
    t.text "text"
    t.decimal "longitude", precision: 12, scale: 9
    t.decimal "latitude", precision: 12, scale: 9
    t.integer "session_id"
    t.integer "number"
    t.index ["session_id"], name: "index_notes_on_session_id"
  end

  create_table "sessions", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil
    t.datetime "updated_at", precision: nil
    t.integer "user_id"
    t.string "uuid"
    t.string "url_token"
    t.text "title"
    t.boolean "contribute"
    t.datetime "start_time_local", precision: nil
    t.datetime "end_time_local", precision: nil
    t.string "type", null: false
    t.boolean "is_indoor"
    t.decimal "latitude", precision: 12, scale: 9
    t.decimal "longitude", precision: 12, scale: 9
    t.datetime "last_measurement_at", precision: nil
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

  create_table "source_stream_configurations", force: :cascade do |t|
    t.bigint "source_id", null: false
    t.bigint "stream_configuration_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["source_id", "stream_configuration_id"], name: "idx_source_stream_cfg_uniq", unique: true
    t.index ["source_id"], name: "index_source_stream_configurations_on_source_id"
    t.index ["stream_configuration_id"], name: "index_source_stream_configurations_on_stream_configuration_id"
  end

  create_table "sources", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_sources_on_name", unique: true
  end

  create_table "stream_configurations", force: :cascade do |t|
    t.string "measurement_type", null: false
    t.string "unit_symbol", null: false
    t.integer "threshold_very_low", null: false
    t.integer "threshold_low", null: false
    t.integer "threshold_medium", null: false
    t.integer "threshold_high", null: false
    t.integer "threshold_very_high", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "canonical", null: false
    t.index ["measurement_type", "unit_symbol"], name: "index_stream_configurations_on_measurement_type_and_unit_symbol", unique: true
  end

  create_table "stream_daily_averages", force: :cascade do |t|
    t.bigint "stream_id", null: false
    t.integer "value", null: false
    t.date "date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stream_id", "date"], name: "index_stream_daily_averages_on_stream_id_and_date", unique: true
  end

  create_table "stream_hourly_averages", force: :cascade do |t|
    t.bigint "stream_id", null: false
    t.integer "value", null: false
    t.datetime "date_time", precision: nil, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stream_id", "date_time"], name: "index_stream_hourly_averages_on_stream_id_and_date_time", unique: true
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
    t.bigint "last_hourly_average_id"
    t.index ["last_hourly_average_id"], name: "index_streams_on_last_hourly_average_id"
    t.index ["max_latitude"], name: "index_streams_on_max_latitude"
    t.index ["max_longitude"], name: "index_streams_on_max_longitude"
    t.index ["min_latitude"], name: "index_streams_on_min_latitude"
    t.index ["min_longitude"], name: "index_streams_on_min_longitude"
    t.index ["sensor_name", "measurement_type"], name: "index_streams_on_sensor_name_and_measurement_type"
    t.index ["sensor_name"], name: "index_streams_on_sensor_name"
    t.index ["sensor_package_name"], name: "index_streams_on_sensor_package_name"
    t.index ["session_id"], name: "index_streams_on_session_id"
    t.index ["threshold_set_id"], name: "index_streams_on_threshold_set_id"
  end

  create_table "taggings", id: :serial, force: :cascade do |t|
    t.integer "tag_id"
    t.string "taggable_type"
    t.integer "taggable_id"
    t.string "tagger_type"
    t.integer "tagger_id"
    t.string "context"
    t.datetime "created_at", precision: nil
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
    t.integer "user_id", null: false
    t.string "session_uuid"
    t.string "sensor_name"
    t.float "threshold_value"
    t.integer "frequency"
    t.datetime "last_email_at", precision: nil
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "timezone_offset", default: 0
    t.datetime "last_check_at", precision: nil
    t.bigint "stream_id", null: false
    t.index ["session_uuid", "sensor_name"], name: "index_threshold_alerts_on_session_uuid_and_sensor_name"
    t.index ["stream_id"], name: "index_threshold_alerts_on_stream_id"
    t.index ["user_id", "stream_id"], name: "index_threshold_alerts_on_user_id_and_stream_id", unique: true
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
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["sensor_name", "unit_symbol"], name: "index_threshold_sets_on_sensor_name_and_unit_symbol"
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", limit: 128, default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at", precision: nil
    t.datetime "remember_created_at", precision: nil
    t.integer "sign_in_count", default: 0
    t.datetime "current_sign_in_at", precision: nil
    t.datetime "last_sign_in_at", precision: nil
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "authentication_token"
    t.datetime "created_at", precision: nil
    t.datetime "updated_at", precision: nil
    t.string "username"
    t.boolean "send_emails"
    t.boolean "admin", default: false
    t.boolean "session_stopped_alert", default: false
    t.string "deletion_confirmation_code"
    t.datetime "deletion_code_valid_until", precision: nil
    t.index ["authentication_token"], name: "index_users_on_authentication_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "fixed_measurements", "fixed_streams"
  add_foreign_key "fixed_measurements", "streams"
  add_foreign_key "fixed_stream_measurements", "fixed_streams", on_delete: :cascade
  add_foreign_key "fixed_streams", "sources"
  add_foreign_key "fixed_streams", "stream_configurations"
  add_foreign_key "hourly_averages", "fixed_streams"
  add_foreign_key "source_stream_configurations", "sources"
  add_foreign_key "source_stream_configurations", "stream_configurations"
  add_foreign_key "stream_daily_averages", "streams"
  add_foreign_key "stream_hourly_averages", "streams"
  add_foreign_key "streams", "stream_hourly_averages", column: "last_hourly_average_id"
  add_foreign_key "streams", "threshold_sets"
  add_foreign_key "threshold_alerts", "streams"
end
