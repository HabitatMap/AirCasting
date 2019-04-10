class Api::CalculateFixedRegionInfo
  def call(form)
    return Failure.new(form.errors) if form.invalid?

    Success.new(FixedRegionInfo.new.call(form.to_h))
  end
end
