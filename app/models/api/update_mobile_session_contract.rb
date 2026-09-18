module Api
  # Partial update for a mobile session: `title` and `tag_list`. Either may be
  # sent, but at least one must be.
  #
  # Deliberately NOT here:
  # - **notes** — their own resource since they became individually addressable:
  #   `GET|POST /api/v3/mobile_sessions/:uuid/notes` and
  #   `PATCH|DELETE .../notes/:id`. As an array in this payload they were
  #   declarative-full, so editing one note meant resending all of them and the
  #   only handle was the client-assigned `number`, which is not stable.
  # - **streams** — created by `POST /api/v3/mobile_sessions`, filled by the
  #   measurements endpoint. The new app deletes whole sessions, never single
  #   streams, so there is nothing for this endpoint to do with them.
  # - **device** — a `devices` row is shared by every session the user recorded
  #   with that AirBeam, so a per-session payload is the wrong place to rename it.
  #   Devices get their own endpoints.
  # - **contribute / time_zone / coordinates** — set once at create.
  class UpdateMobileSessionContract < Dry::Validation::Contract
    EDITABLE_KEYS = %i[title tag_list].freeze

    params do
      optional(:title).filled(:string)
      # nil / "" clears every tag.
      optional(:tag_list).maybe(:string)
    end

    # An empty body would otherwise bump `version` and make every other device
    # re-download the session for no change at all.
    rule do
      if EDITABLE_KEYS.none? { |key| values.key?(key) }
        key(:base).failure("must contain at least one of: #{EDITABLE_KEYS.join(', ')}")
      end
    end
  end
end
