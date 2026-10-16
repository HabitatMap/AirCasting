module Api
  class FinishMobileSessionContract < Dry::Validation::Contract

    params do
      optional(:finished_at).maybe(:integer)
    end

    rule(:finished_at) do
      next unless key? && value

      key.failure('must not be in the future') if (value / 1_000) > Time.current.to_i
    end
  end
end
