class IdSerializer
  attr_reader :record

  def initialize(record)
    @record = record
  end

  def as_json(*args)
    {
      id: record.id
    }
  end
end
