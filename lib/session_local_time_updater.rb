class SessionLocalTimeUpdater
  def self.update(session)
    session.start_time_local = session.measurements.minimum('time')
    session.end_time_local = session.measurements.maximum('time')

    session.save
  end
end
