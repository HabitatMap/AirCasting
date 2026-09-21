module Api
  # Partial update for a fixed session: `title` and `tag_list`. Either may be
  # sent, but at least one must be.
  #
  # Deliberately NOT here:
  # - **is_indoor / contribute / time_zone / latitude / longitude** — set once
  #   at create; the sensor's deployment does not move under an existing
  #   session.
  # - **device** — a `devices` row is shared by every session recorded with
  #   that AirBeam, so a per-session payload is the wrong place to rename it.
  #   Devices get their own endpoints.
  # - **streams** — created by `FixedSessions::Creator`, filled by the
  #   measurements endpoint. Nothing about a stream is editable here.
  class UpdateFixedSessionContract < Dry::Validation::Contract
    EDITABLE_KEYS = %i[title tag_list].freeze

    params do
      optional(:title).filled(:string)
      # nil / "" clears every tag.
      optional(:tag_list).maybe(:string)
    end

    # An empty body would otherwise bump `version` for no change at all.
    rule do
      if EDITABLE_KEYS.none? { |key| values.key?(key) }
        key(:base).failure("must contain at least one of: #{EDITABLE_KEYS.join(', ')}")
      end
    end
  end
end
