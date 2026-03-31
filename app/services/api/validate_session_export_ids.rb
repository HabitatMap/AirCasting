# frozen_string_literal: true

class Api::ValidateSessionExportIds
  def self.call(session_ids:)
    new(session_ids: session_ids).call
  end

  def initialize(session_ids:)
    @session_ids = session_ids
  end

  def call
    unique_ids = @session_ids.uniq

    return Failure.new(session_ids: ['must include at least one session']) if unique_ids.empty?

    sessions = Session.where(id: unique_ids).includes(:streams)

    if sessions.size != unique_ids.size
      return Failure.new(session_ids: ['unknown session ids'])
    end

    types = sessions.map(&:type).uniq
    if types.size > 1
      return Failure.new(session_ids: ['cannot mix mobile and fixed sessions in one export'])
    end

    if types == ['MobileSession']
      return failure_if_over(Api::ExportLimits::SESSION_IDS_MAX_STANDARD, unique_ids.size)
    end

    if sessions.any? { |s| s.streams.empty? }
      return Failure.new(session_ids: ['fixed sessions must include streams'])
    end

    categories = sessions.map { |s| fixed_session_export_category(s) }
    if categories.include?(:mixed)
      return Failure.new(session_ids: ['inconsistent sensor types within a session'])
    end

    uniq_cats = categories.uniq
    if uniq_cats.size > 1
      return Failure.new(session_ids: ['cannot mix fixed session export types'])
    end

    limit =
      case uniq_cats.first
      when :gov, :other
        Api::ExportLimits::SESSION_IDS_MAX_STANDARD
      when :air
        Api::ExportLimits::SESSION_IDS_MAX_FIXED_AIR
      end

    failure_if_over(limit, unique_ids.size)
  end

  private

  def fixed_session_export_category(session)
    cats = session.streams.map { |st| stream_category(st.sensor_name) }.uniq
    return :mixed if cats.size > 1

    cats.first
  end

  def stream_category(name)
    n = name.to_s.downcase
    return :gov if n.start_with?('government')
    return :air if n.start_with?('air')

    :other
  end

  def failure_if_over(limit, size)
    if size > limit
      return Failure.new(session_ids: ["cannot export more than #{limit} sessions at once"])
    end

    Success.new(nil)
  end
end
