module Api
  class FinishMobileSessionContract < Dry::Validation::Contract

    params do
      optional(:finished_at).maybe(:integer)
    end

    rule(:finished_at) do
      next unless key? && value

      next if (value / 1_000) <= Time.current.to_i

      key.failure(text: 'must not be in the future', code: 'in_the_future')
    end
  end
end
