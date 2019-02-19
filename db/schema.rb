# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20190212125754) do

  create_table "deleted_sessions", force: :cascade do |t|
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
    t.string   "uuid",       limit: 255
    t.integer  "user_id",    limit: 4
  end

  add_index "deleted_sessions", ["user_id"], name: "index_deleted_sessions_on_user_id", using: :btree
  add_index "deleted_sessions", ["uuid", "user_id"], name: "index_deleted_sessions_on_uuid_and_user_id", using: :btree

  create_table "measurements", force: :cascade do |t|
    t.float    "value",           limit: 24
    t.decimal  "latitude",                   precision: 12, scale: 9
    t.decimal  "longitude",                  precision: 12, scale: 9
    t.datetime "time"
    t.integer  "timezone_offset", limit: 4
    t.integer  "stream_id",       limit: 4
    t.integer  "milliseconds",    limit: 4,                           default: 0
    t.float    "measured_value",  limit: 24
  end

  add_index "measurements", ["stream_id", "time"], name: "index_measurements_on_stream_id_and_time", using: :btree

  create_table "notes", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "date"
    t.text     "text",               limit: 65535
    t.decimal  "longitude",                        precision: 12, scale: 9
    t.decimal  "latitude",                         precision: 12, scale: 9
    t.integer  "session_id",         limit: 4
    t.string   "photo_file_name",    limit: 255
    t.string   "photo_content_type", limit: 255
    t.integer  "photo_file_size",    limit: 4
    t.datetime "photo_updated_at"
    t.integer  "number",             limit: 4
  end

  add_index "notes", ["session_id"], name: "index_notes_on_session_id", using: :btree

  create_table "regressions", force: :cascade do |t|
    t.datetime "created_at",                                  null: false
    t.datetime "updated_at",                                  null: false
    t.string   "sensor_package_name",           limit: 255
    t.string   "measurement_type",              limit: 255
    t.string   "unit_name",                     limit: 255
    t.string   "unit_symbol",                   limit: 255
    t.integer  "threshold_very_low",            limit: 4
    t.integer  "threshold_low",                 limit: 4
    t.integer  "threshold_medium",              limit: 4
    t.integer  "threshold_high",                limit: 4
    t.integer  "threshold_very_high",           limit: 4
    t.text     "coefficients",                  limit: 65535
    t.string   "sensor_name",                   limit: 255
    t.string   "measurement_short_type",        limit: 255
    t.string   "reference_sensor_package_name", limit: 255
    t.string   "reference_sensor_name",         limit: 255
    t.integer  "user_id",                       limit: 4
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "user_id",             limit: 4
    t.string   "uuid",                limit: 255
    t.string   "url_token",           limit: 255
    t.text     "title",               limit: 65535
    t.text     "description",         limit: 65535
    t.integer  "calibration",         limit: 4
    t.boolean  "contribute"
    t.string   "data_type",           limit: 255
    t.string   "instrument",          limit: 255
    t.string   "phone_model",         limit: 255
    t.string   "os_version",          limit: 255
    t.integer  "offset_60_db",        limit: 4
    t.datetime "start_time"
    t.datetime "end_time"
    t.integer  "measurements_count",  limit: 4
    t.integer  "timezone_offset",     limit: 4
    t.datetime "start_time_local"
    t.datetime "end_time_local"
    t.string   "type",                limit: 255,                            null: false
    t.boolean  "is_indoor"
    t.decimal  "latitude",                          precision: 12, scale: 9
    t.decimal  "longitude",                         precision: 12, scale: 9
    t.datetime "last_measurement_at"
  end

  add_index "sessions", ["contribute"], name: "index_sessions_on_contribute", using: :btree
  add_index "sessions", ["end_time"], name: "index_sessions_on_end_time", using: :btree
  add_index "sessions", ["end_time_local"], name: "index_sessions_on_end_time_local", using: :btree
  add_index "sessions", ["last_measurement_at"], name: "index_sessions_on_last_measurement_at", using: :btree
  add_index "sessions", ["start_time"], name: "index_sessions_on_start_time", using: :btree
  add_index "sessions", ["start_time_local"], name: "index_sessions_on_start_time_local", using: :btree
  add_index "sessions", ["url_token"], name: "index_sessions_on_url_token", using: :btree
  add_index "sessions", ["user_id"], name: "index_sessions_on_user_id", using: :btree
  add_index "sessions", ["uuid"], name: "index_sessions_on_uuid", using: :btree

  create_table "streams", force: :cascade do |t|
    t.string  "sensor_name",            limit: 255
    t.string  "unit_name",              limit: 255
    t.string  "measurement_type",       limit: 255
    t.string  "measurement_short_type", limit: 255
    t.string  "unit_symbol",            limit: 255
    t.integer "threshold_very_low",     limit: 4
    t.integer "threshold_low",          limit: 4
    t.integer "threshold_medium",       limit: 4
    t.integer "threshold_high",         limit: 4
    t.integer "threshold_very_high",    limit: 4
    t.integer "session_id",             limit: 4
    t.string  "sensor_package_name",    limit: 255,                          default: "Builtin", null: false
    t.integer "measurements_count",     limit: 4,                            default: 0,         null: false
    t.decimal "min_latitude",                       precision: 12, scale: 9
    t.decimal "max_latitude",                       precision: 12, scale: 9
    t.decimal "min_longitude",                      precision: 12, scale: 9
    t.decimal "max_longitude",                      precision: 12, scale: 9
    t.float   "average_value",          limit: 24
    t.decimal "start_longitude",                    precision: 12, scale: 9
    t.decimal "start_latitude",                     precision: 12, scale: 9
  end

  add_index "streams", ["max_latitude"], name: "index_streams_on_max_latitude", using: :btree
  add_index "streams", ["max_longitude"], name: "index_streams_on_max_longitude", using: :btree
  add_index "streams", ["min_latitude"], name: "index_streams_on_min_latitude", using: :btree
  add_index "streams", ["min_longitude"], name: "index_streams_on_min_longitude", using: :btree
  add_index "streams", ["sensor_name", "measurement_type"], name: "index_streams_on_sensor_name_and_measurement_type", using: :btree
  add_index "streams", ["sensor_name"], name: "index_streams_on_sensor_name", using: :btree
  add_index "streams", ["session_id"], name: "index_streams_on_session_id", using: :btree

  create_table "taggings", force: :cascade do |t|
    t.integer  "tag_id",        limit: 4
    t.integer  "taggable_id",   limit: 4
    t.string   "taggable_type", limit: 255
    t.integer  "tagger_id",     limit: 4
    t.string   "tagger_type",   limit: 255
    t.string   "context",       limit: 255
    t.datetime "created_at"
  end

  add_index "taggings", ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_idx", unique: true, using: :btree
  add_index "taggings", ["taggable_id", "taggable_type", "context"], name: "index_taggings_on_taggable_id_and_taggable_type_and_context", using: :btree

  create_table "tags", force: :cascade do |t|
    t.string  "name",           limit: 255
    t.integer "taggings_count", limit: 4,   default: 0
  end

  add_index "tags", ["name"], name: "index_tags_on_name", using: :btree

  create_table "users", force: :cascade do |t|
    t.string   "email",                  limit: 255, default: "",    null: false
    t.string   "encrypted_password",     limit: 128, default: "",    null: false
    t.string   "reset_password_token",   limit: 255
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          limit: 4,   default: 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip",     limit: 255
    t.string   "last_sign_in_ip",        limit: 255
    t.string   "authentication_token",   limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "username",               limit: 255
    t.boolean  "send_emails"
    t.boolean  "admin",                              default: false
  end

  add_index "users", ["authentication_token"], name: "index_users_on_authentication_token", unique: true, using: :btree
  add_index "users", ["email"], name: "index_users_on_email", unique: true, using: :btree
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true, using: :btree

end
