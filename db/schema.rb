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
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20160530152400) do

  create_table "deleted_sessions", :force => true do |t|
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.string   "uuid"
    t.integer  "user_id"
  end

  add_index "deleted_sessions", ["user_id"], :name => "index_deleted_sessions_on_user_id"
  add_index "deleted_sessions", ["uuid", "user_id"], :name => "index_deleted_sessions_on_uuid_and_user_id"

  create_table "measurements", :force => true do |t|
    t.float    "value"
    t.decimal  "latitude",        :precision => 12, :scale => 9
    t.decimal  "longitude",       :precision => 12, :scale => 9
    t.datetime "time"
    t.integer  "timezone_offset"
    t.integer  "stream_id"
    t.integer  "milliseconds",                                   :default => 0
    t.float    "measured_value"
  end

  add_index "measurements", ["latitude"], :name => "index_measurements_on_latitude"
  add_index "measurements", ["longitude", "latitude"], :name => "index_measurements_on_longitude_and_latitude"
  add_index "measurements", ["longitude"], :name => "index_measurements_on_longitude"
  add_index "measurements", ["stream_id"], :name => "index_measurements_on_stream_id"
  add_index "measurements", ["time"], :name => "index_measurements_on_time"

  create_table "notes", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "date"
    t.text     "text"
    t.decimal  "longitude",          :precision => 12, :scale => 9
    t.decimal  "latitude",           :precision => 12, :scale => 9
    t.integer  "session_id"
    t.string   "photo_file_name"
    t.string   "photo_content_type"
    t.integer  "photo_file_size"
    t.datetime "photo_updated_at"
    t.integer  "number"
  end

  add_index "notes", ["session_id"], :name => "index_notes_on_session_id"

  create_table "regressions", :force => true do |t|
    t.datetime "created_at",                    :null => false
    t.datetime "updated_at",                    :null => false
    t.string   "sensor_package_name"
    t.string   "measurement_type"
    t.string   "unit_name"
    t.string   "unit_symbol"
    t.integer  "threshold_very_low"
    t.integer  "threshold_low"
    t.integer  "threshold_medium"
    t.integer  "threshold_high"
    t.integer  "threshold_very_high"
    t.text     "coefficients"
    t.string   "sensor_name"
    t.string   "measurement_short_type"
    t.string   "reference_sensor_package_name"
    t.string   "reference_sensor_name"
    t.integer  "user_id"
  end

  create_table "sessions", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "user_id"
    t.string   "uuid"
    t.string   "url_token"
    t.text     "title"
    t.text     "description"
    t.integer  "calibration"
    t.boolean  "contribute"
    t.string   "data_type"
    t.string   "instrument"
    t.string   "phone_model"
    t.string   "os_version"
    t.integer  "offset_60_db"
    t.datetime "start_time"
    t.datetime "end_time"
    t.integer  "measurements_count"
    t.integer  "timezone_offset"
    t.datetime "start_time_local"
    t.datetime "end_time_local"
    t.string   "type",                                              :null => false
    t.boolean  "is_indoor"
    t.decimal  "latitude",           :precision => 12, :scale => 9
    t.decimal  "longitude",          :precision => 12, :scale => 9
  end

  add_index "sessions", ["contribute"], :name => "index_sessions_on_contribute"
  add_index "sessions", ["end_time"], :name => "index_sessions_on_end_time"
  add_index "sessions", ["end_time_local"], :name => "index_sessions_on_local_end_time"
  add_index "sessions", ["start_time"], :name => "index_sessions_on_start_time"
  add_index "sessions", ["start_time_local"], :name => "index_sessions_on_local_start_time"
  add_index "sessions", ["url_token"], :name => "index_sessions_on_url_token"
  add_index "sessions", ["user_id"], :name => "index_sessions_on_user_id"
  add_index "sessions", ["uuid"], :name => "index_sessions_on_uuid"

  create_table "streams", :force => true do |t|
    t.string  "sensor_name"
    t.string  "unit_name"
    t.string  "measurement_type"
    t.string  "measurement_short_type"
    t.string  "unit_symbol"
    t.integer "threshold_very_low"
    t.integer "threshold_low"
    t.integer "threshold_medium"
    t.integer "threshold_high"
    t.integer "threshold_very_high"
    t.integer "session_id"
    t.string  "sensor_package_name",                                   :default => "Builtin", :null => false
    t.integer "measurements_count",                                    :default => 0,         :null => false
    t.decimal "min_latitude",           :precision => 12, :scale => 9
    t.decimal "max_latitude",           :precision => 12, :scale => 9
    t.decimal "min_longitude",          :precision => 12, :scale => 9
    t.decimal "max_longitude",          :precision => 12, :scale => 9
    t.float   "average_value"
  end

  add_index "streams", ["max_latitude"], :name => "index_streams_on_max_latitude"
  add_index "streams", ["max_longitude"], :name => "index_streams_on_max_longitude"
  add_index "streams", ["min_latitude"], :name => "index_streams_on_min_latitude"
  add_index "streams", ["min_longitude"], :name => "index_streams_on_min_longitude"
  add_index "streams", ["sensor_name", "measurement_type"], :name => "index_streams_on_sensor_name_and_measurement_type"
  add_index "streams", ["sensor_name"], :name => "index_streams_on_sensor_name"
  add_index "streams", ["session_id"], :name => "index_streams_on_session_id"

  create_table "taggings", :force => true do |t|
    t.integer  "tag_id"
    t.integer  "taggable_id"
    t.string   "taggable_type"
    t.integer  "tagger_id"
    t.string   "tagger_type"
    t.string   "context"
    t.datetime "created_at"
  end

  add_index "taggings", ["tag_id"], :name => "index_taggings_on_tag_id"
  add_index "taggings", ["taggable_id", "taggable_type", "context"], :name => "index_taggings_on_taggable_id_and_taggable_type_and_context"

  create_table "tags", :force => true do |t|
    t.string "name"
  end

  add_index "tags", ["name"], :name => "index_tags_on_name"

  create_table "users", :force => true do |t|
    t.string   "email",                                 :default => "",    :null => false
    t.string   "encrypted_password",     :limit => 128, :default => "",    :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",                         :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.string   "authentication_token"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "username"
    t.boolean  "send_emails"
    t.boolean  "admin",                                 :default => false
  end

  add_index "users", ["authentication_token"], :name => "index_users_on_authentication_token", :unique => true
  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

end
