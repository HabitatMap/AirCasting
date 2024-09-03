class MobileSession < Session
  def as_synchronizable(stream_measurements)
    as_json(methods: %i[streams], stream_measurements: stream_measurements)
  end

  def self.filtered_json_fields
    %i[id title start_time_local end_time_local]
  end

  def fixed?
    false
  end

  def generate_link(stream)
    super
  end
end
