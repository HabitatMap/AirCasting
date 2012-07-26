class SessionLocalTimeUpdater
  def self.update(session)
    timezone_offset = session.timezone_offset
    unless timezone_offset
      timezone_offset = session.measurements.first.timezone_offset
    end

    unless timezone_offset
      timezone_offset = 0
    end

    session.local_start_time = session.start_time
    session.local_end_time = session.end_time

    begin
      session.local_start_time += timezone_offset.minutes
      session.local_end_time += timezone_offset.minutes
    rescue => e
      p e.inspect
    end

    session.save
  end
end
