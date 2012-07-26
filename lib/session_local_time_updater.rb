class SessionLocalTimeUpdater
  def self.update(session)
    session.local_start_time = session.measurements.minimum('time')
    session.local_end_time = session.measurements.maximum('time')

    session.save
  end
end
