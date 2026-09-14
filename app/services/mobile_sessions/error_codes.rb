module MobileSessions
  # API-level error codes specific to the mobile session endpoints. Deliberately a
  # copy of (not a reference to) the fixed-session list — the two sets differ
  # (mobile has `session_uuid_taken`) and are free to drift further. The binary
  # parser owns its own code list the same way (see
  # BinaryProtocol::Parser::ErrorCodes).
  #
  # `unauthorized` is intentionally absent: it comes from the shared
  # `Api::V3::ErrorCodes` via `Api::V3::BaseController#require_authentication!`,
  # which is what these endpoints render on a 401.
  module ErrorCodes
    UNSUPPORTED_SENSOR_TYPE = 'unsupported_sensor_type'
    SESSION_NOT_FOUND       = 'session_not_found'
    SESSION_UUID_TAKEN      = 'session_uuid_taken'
    VALIDATION_ERROR        = 'validation_error'
    INTERNAL_ERROR          = 'internal_error'
    TRY_AGAIN_LATER         = 'try_again_later'
  end
end
