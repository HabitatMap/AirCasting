module AirCasting
  module FilterRange
    extend ActiveSupport::Concern

    module ClassMethods
      def prepare_range(name, field)
        scope name,
              lambda { |low, high|
                if low && high
                  if low <= high
                    where("#{field} >= ?", low).where("#{field} <= ?", high)
                  else
                    where(
                      "#{field} >= :low OR #{field} <= :high",
                      low: low,
                      high: high
                    )
                  end
                end
              }
      end
    end
  end
end
