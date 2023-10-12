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

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", limit: 255, null: false
    t.string "record_type", limit: 255, null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "public_active_storage_attachments_blob_id1_idx"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "public_active_storage_attachments_record_type0_idx", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", limit: 255, null: false
    t.string "filename", limit: 255, null: false
    t.string "content_type", limit: 255
    t.text "metadata"
    t.bigint "byte_size", null: false
    t.string "checksum", limit: 255, null: false
    t.datetime "created_at", null: false
    t.string "service_name", limit: 255, null: false
    t.index ["key"], name: "public_active_storage_blobs_key0_idx", unique: true
  end

  create_table "deleted_sessions", id: :serial, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "uuid", limit: 255
    t.integer "user_id"
    t.index ["user_id"], name: "public_deleted_sessions_user_id1_idx"
    t.index ["uuid", "user_id"], name: "public_deleted_sessions_uuid0_idx"
  end

  create_table "flipper_features", charset: "utf8mb3", force: :cascade do |t|
    t.string "key", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["key"], name: "index_flipper_features_on_key", unique: true
  end

  create_table "flipper_gates", charset: "utf8mb3", force: :cascade do |t|
    t.string "feature_key", null: false
    t.string "key", null: false
    t.text "value"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["feature_key", "key", "value"], name: "index_flipper_gates_on_feature_key_and_key_and_value", unique: true, length: { value: 255 }
  end

  create_table "measurements", id: :integer, charset: "utf8mb3", force: :cascade do |t|
    t.float "value"
    t.decimal "latitude", precision: 12, scale: 9
    t.decimal "longitude", precision: 12, scale: 9
    t.datetime "time"
    t.integer "timezone_offset"
    t.integer "stream_id"
    t.integer "milliseconds", default: 0
    t.float "measured_value"
    t.index ["stream_id", "time"], name: "public_measurements_stream_id0_idx"
  end

  create_table "notes", id: :serial, force: :cascade do |t|
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
    t.index ["session_id"], name: "public_notes_session_id0_idx"
  end

  create_table "sessions", id: :serial, force: :cascade do |t|
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
    t.decimal "latitude", precision: 12, scale: 9
    t.decimal "longitude", precision: 12, scale: 9
    t.datetime "last_measurement_at"
    t.integer "version", default: 1
    t.index ["contribute"], name: "index_sessions_on_contribute"
    t.index ["end_time_local"], name: "index_sessions_on_end_time_local"
    t.index ["last_measurement_at"], name: "index_sessions_on_last_measurement_at"
    t.index ["start_time_local"], name: "index_sessions_on_start_time_local"
    t.index ["url_token"], name: "index_sessions_on_url_token"
    t.index ["user_id"], name: "index_sessions_on_user_id"
    t.index ["uuid"], name: "index_sessions_on_uuid"
  end

  create_table "streams", id: :serial, force: :cascade do |t|
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
    t.index ["max_latitude"], name: "public_streams_max_latitude3_idx"
    t.index ["max_longitude"], name: "public_streams_max_longitude5_idx"
    t.index ["min_latitude"], name: "public_streams_min_latitude2_idx"
    t.index ["min_longitude"], name: "public_streams_min_longitude4_idx"
    t.index ["sensor_name", "measurement_type"], name: "public_streams_sensor_name1_idx"
    t.index ["sensor_name"], name: "public_streams_sensor_name6_idx"
    t.index ["session_id"], name: "public_streams_session_id0_idx"
  end

  create_table "taggings", id: :serial, force: :cascade do |t|
    t.integer "tag_id"
    t.integer "taggable_id"
    t.string "taggable_type", limit: 255
    t.integer "tagger_id"
    t.string "tagger_type", limit: 255
    t.string "context", limit: 255
    t.datetime "created_at"
    t.index ["context"], name: "public_taggings_context6_idx"
    t.index ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "public_taggings_tag_id0_idx", unique: true
    t.index ["tag_id"], name: "public_taggings_tag_id2_idx"
    t.index ["taggable_id", "taggable_type", "context"], name: "public_taggings_taggable_id1_idx"
    t.index ["taggable_id", "taggable_type", "tagger_id", "context"], name: "public_taggings_taggable_id8_idx"
    t.index ["taggable_id"], name: "public_taggings_taggable_id3_idx"
    t.index ["taggable_type"], name: "public_taggings_taggable_type4_idx"
    t.index ["tagger_id", "tagger_type"], name: "public_taggings_tagger_id7_idx"
    t.index ["tagger_id"], name: "public_taggings_tagger_id5_idx"
  end

  create_table "tags", force: :cascade do |t|
    t.string "name"
    t.integer "taggings_count", default: 0
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["name"], name: "index_tags_on_name"
  end

  create_table "threshold_alerts", force: :cascade do |t|
    t.integer "user_id"
    t.string "session_uuid", limit: 255
    t.string "sensor_name", limit: 255
    t.float "threshold_value"
    t.integer "frequency"
    t.datetime "last_email_at"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "timezone_offset", default: 0
    t.index ["session_uuid", "sensor_name"], name: "public_threshold_alerts_session_uuid0_idx"
  end

  create_table "users", id: :serial, force: :cascade do |t|
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
    t.index ["authentication_token"], name: "public_users_authentication_token2_idx", unique: true
    t.index ["email"], name: "public_users_email0_idx", unique: true
    t.index ["reset_password_token"], name: "public_users_reset_password_token1_idx", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id", name: "active_storage_attachments_blob_id_fkey"
end
