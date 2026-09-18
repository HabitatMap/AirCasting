module Api
  # Query parameters for GET /api/v3/fixed_sessions.
  #
  # Validated, not silently defaulted: `per_page=abc` falling back to 0 would answer
  # 200 with an empty list, and an empty list means "all your sessions were deleted"
  # under this endpoint's contract. A user deploys a handful of sensors, so
  # MAX_PER_PAGE sits far above any real account and one request fetches everything.
  class ListFixedSessionsContract < Dry::Validation::Contract
    MAX_PER_PAGE = 500

    params do
      optional(:page).filled(:integer, gteq?: 1)
      optional(:per_page).filled(:integer, gteq?: 1, lteq?: MAX_PER_PAGE)
    end
  end
end
