module BinaryProtocol
  # Sentry reporting for the binary measurement upload endpoints.
  #
  # Shared by fixed and mobile because both speak the same envelope and fail the
  # same ways. `source` keeps them apart: it is part of every event name, so the
  # two never collapse into one Sentry issue, and it is a tag so you can filter
  # or alert on one without the other.
  #
  # Note the constant is top-level. Inside `FixedSessions` or `MobileSessions`,
  # a bare `BinaryProtocol::Monitor` resolves to the nested namespace first —
  # always write `::BinaryProtocol::Monitor`.
  class Monitor
    FIXED = 'fixed'.freeze
    MOBILE = 'mobile'.freeze
    SOURCES = [FIXED, MOBILE].freeze

    module Severity
      ERROR   = 'error'
      WARNING = 'warning'
      INFO    = 'info'
    end

    # Mirrors the `error_code` the endpoint renders, so a Sentry event can be
    # matched against what the client actually received. Kept as literals rather
    # than pointing at one domain's ErrorCodes: the two domains own separate
    # vocabularies and this class must not pick a side.
    ERROR_CODES = {
      unknown_sensor_type: 'unsupported_sensor_type',
      session_not_found: 'session_not_found',
      auth_failure: 'unauthorized',
      import_failure: 'internal_error',
      transaction_error: 'internal_error',
    }.freeze

    def initialize(source:)
      raise ArgumentError, "unknown source #{source.inspect}" unless SOURCES.include?(source)

      @source = source
    end

    def report_parse_error(error_code:, message:, session:, binary_size:, measurement_count:)
      report(
        event: "parse_error.#{error_code}",
        severity: Severity::ERROR,
        tags: { error_code: error_code, measurement_count: measurement_count },
        context: {
          message: message,
          session_uuid: session.uuid,
          session_time_zone: session.time_zone,
          binary_size: binary_size,
          measurement_count: measurement_count,
        },
      )
    end

    # Frames for a sensor the session has no stream for. They are dropped and the
    # upload still succeeds, so this event is the only trace they existed.
    def report_unknown_sensor_type(session:, sensor_type_id:, known_sensor_type_ids:)
      report(
        event: 'unknown_sensor_type',
        severity: Severity::WARNING,
        tags: { error_code: ERROR_CODES[:unknown_sensor_type], sensor_type_id: sensor_type_id },
        context: {
          session_uuid: session.uuid,
          sensor_type_id: sensor_type_id,
          known_sensor_type_ids: known_sensor_type_ids,
        },
      )
    end

    def report_session_not_found(session_uuid:, auth_method: nil)
      report(
        event: 'session_not_found',
        severity: Severity::WARNING,
        tags: { error_code: ERROR_CODES[:session_not_found], auth_method: auth_method }.compact,
        context: { session_uuid: session_uuid },
      )
    end

    def report_auth_failure(session_uuid:)
      report(
        event: 'auth_failure',
        severity: Severity::WARNING,
        tags: { error_code: ERROR_CODES[:auth_failure] },
        context: { session_uuid: session_uuid },
      )
    end

    # Rows the bulk import rejected. The response is still a 200, so without this
    # the loss is invisible on both ends.
    def report_import_failure(session:, stream_id:, failed_count:, message: nil)
      report(
        event: 'import_failure',
        severity: Severity::ERROR,
        tags: { error_code: ERROR_CODES[:import_failure], stream_id: stream_id },
        context: {
          session_uuid: session.uuid,
          stream_id: stream_id,
          failed_count: failed_count,
          message: message,
        }.compact,
      )
    end

    def report_transaction_error(session:, message:)
      report(
        event: 'transaction_error',
        severity: Severity::ERROR,
        tags: { error_code: ERROR_CODES[:transaction_error] },
        context: {
          session_uuid: session.uuid,
          message: message,
        },
      )
    end

    private

    attr_reader :source

    def report(event:, severity:, tags:, context:)
      event_name = "binary_protocol.#{source}.#{event}"

      Sentry.with_scope do |scope|
        scope.set_tags(tags.merge(source: 'binary_protocol', session_kind: source))
        scope.set_context('binary_protocol', context)
        scope.set_fingerprint([event_name, tags[:error_code]].compact)
        Sentry.capture_message(event_name, level: severity)
      end
    end
  end
end
