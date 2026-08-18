module MobileSessions
  # API-level error codes for the mobile session endpoints. Deliberately a copy
  # of (not a reference to) the fixed-session list: the two sets already differ
  # — mobile has `session_uuid_taken`, fixed has `unauthorized` — and they are
  # free to drift further. The binary parsers own their own code lists the same
  # way (see BinaryProtocol::Parser::ErrorCodes).
  module ErrorCodes
    UNSUPPORTED_SENSOR_TYPE = 'unsupported_sensor_type'
    SESSION_NOT_FOUND       = 'session_not_found'
    SESSION_UUID_TAKEN      = 'session_uuid_taken'
    VALIDATION_ERROR        = 'validation_error'
    INTERNAL_ERROR          = 'internal_error'
  end
end
