module Api
  module V3
    # Codes every v3 endpoint can return. Endpoint-specific vocabularies
    # (MobileSessions::ErrorCodes, FixedSessions::BinaryProtocol::ErrorCodes)
    # add their own on top and are free to drift.
    module ErrorCodes
      VALIDATION_ERROR = 'validation_error'
      UNAUTHORIZED     = 'unauthorized'
      NOT_FOUND        = 'not_found'
      INTERNAL_ERROR   = 'internal_error'
    end
  end
end
