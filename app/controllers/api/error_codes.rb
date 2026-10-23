module Api
  # Codes any endpoint answering the shared error envelope can return.
  # Endpoint-specific vocabularies (MobileSessions::ErrorCodes,
  # FixedSessions::BinaryProtocol::ErrorCodes) add their own on top and are
  # free to drift.
  #
  # Lives under `Api` rather than `Api::V3` because `/api/user` answers the
  # same envelope. Code inside `Api::V3` still writes a bare `ErrorCodes::X`
  # and reaches this through the enclosing namespace.
  module ErrorCodes
    VALIDATION_ERROR = 'validation_error'
    UNAUTHORIZED     = 'unauthorized'
    NOT_FOUND        = 'not_found'
    PAYLOAD_TOO_LARGE = 'payload_too_large'
    INTERNAL_ERROR   = 'internal_error'
    TRY_AGAIN_LATER  = 'try_again_later'
  end
end
