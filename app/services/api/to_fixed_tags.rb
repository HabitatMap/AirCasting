class Api::ToFixedTags
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    sessions = data[:is_active] ? FixedSession.active.filter_(data) : FixedSession.dormant.filter_(data)

    tags = sessions.tag_counts.where(['tags.name ILIKE ?', "#{data[:input]}%"])

    Success.new(tags.map(&:name).sort_by { |word| words_first(word) })
  end

  private

  attr_reader :form

  def data
    form.to_h.to_h
  end

  def words_first(str)
    str[0] =~ /[[:alpha:]]/ ? '0' + str.downcase : '1' + str.downcase
  end
end
