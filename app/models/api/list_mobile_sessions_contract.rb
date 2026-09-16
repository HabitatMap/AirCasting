module Api
  # Query parameters for GET /api/v3/mobile_sessions.
  #
  # Validated, not coerced: `per_page=abc` read leniently as 0 would answer 200
  # with an empty list, and an empty list means "all your sessions were deleted"
  # under this endpoint's contract. MAX_PER_PAGE sits above the p99 sessions per
  # user, so nearly every account still fetches everything in one request.
  class ListMobileSessionsContract < Dry::Validation::Contract
    MAX_PER_PAGE = 500

    params do
      optional(:page).filled(:integer, gteq?: 1)
      optional(:per_page).filled(:integer, gteq?: 1, lteq?: MAX_PER_PAGE)
    end
  end
end
