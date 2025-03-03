class Api::ToFixedTags
  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    sessions =
      if data[:is_active]
        FixedSession.active.filter_(data)
      else
        FixedSession.dormant.filter_(data)
      end

    tags = sessions.tag_counts.where(['tags.name ILIKE ?', "#{data[:input]}%"])

    Success.new(tags.map(&:name).sort_by { |word| words_first(word) })
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end

  def words_first(str)
    str[0] =~ /[[:alpha:]]/ ? '0' + str.downcase : '1' + str.downcase
  end
end
