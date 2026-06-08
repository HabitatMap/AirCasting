module FixedSessions
  module BinaryProtocol
    class Monitor
      module Severity
        ERROR   = 'error'
        WARNING = 'warning'
        INFO    = 'info'
      end

      def report_parse_error(error_code:, message:, session:, binary_size:, measurement_count:)
        report(
          event_name: "binary_protocol.parse_error.#{error_code}",
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

      def report_unknown_sensor_type(session:, sensor_type_id:, known_sensor_type_ids:)
        report(
          event_name: "binary_protocol.unknown_sensor_type",
          severity: Severity::WARNING,
          tags: { error_code: ErrorCodes::UNSUPPORTED_SENSOR_TYPE, sensor_type_id: sensor_type_id },
          context: {
            session_uuid: session.uuid,
            sensor_type_id: sensor_type_id,
            known_sensor_type_ids: known_sensor_type_ids,
          },
        )
      end

      def report_session_not_found(session_uuid:, auth_method:)
        report(
          event_name: "binary_protocol.session_not_found",
          severity: Severity::WARNING,
          tags: { error_code: ErrorCodes::SESSION_NOT_FOUND, auth_method: auth_method },
          context: {
            session_uuid: session_uuid,
          },
        )
      end

      def report_auth_failure(session_uuid:)
        report(
          event_name: "binary_protocol.auth_failure",
          severity: Severity::WARNING,
          tags: { error_code: ErrorCodes::UNAUTHORIZED },
          context: {
            session_uuid: session_uuid,
          },
        )
      end

      def report_transaction_error(session:, message:)
        report(
          event_name: "binary_protocol.transaction_error",
          severity: Severity::ERROR,
          tags: { error_code: ErrorCodes::INTERNAL_ERROR },
          context: {
            session_uuid: session.uuid,
            message: message,
          },
        )
      end

      private

      def report(event_name:, severity:, tags:, context:)
        Sentry.with_scope do |scope|
          scope.set_tags(tags.merge(source: 'binary_protocol'))
          scope.set_context('binary_protocol', context)
          scope.set_fingerprint([event_name, tags[:error_code]].compact)
          Sentry.capture_message(event_name, level: severity)
        end
      end
    end
  end
end
