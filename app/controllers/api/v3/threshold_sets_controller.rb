module Api
  module V3
    # The default colour-scale bands for every measurement AirCasting serves,
    # so a client does not ship its own copy. Until this existed each app
    # hardcoded them, and they had drifted apart from each other and from the
    # server.
    #
    # One entry per measurement parameter rather than per AirBeam model, with
    # the device spellings listed in `aliases`. Nothing user-specific, so no
    # authentication.
    class ThresholdSetsController < BaseController
      CACHE_MAX_AGE = 1.hour

      def index
        entries = ::ThresholdSets::Defaults.new.call

        expires_in CACHE_MAX_AGE, public: true

        render json: DefaultThresholdSetsSerializer.new(entries).call
      end
    end
  end
end
