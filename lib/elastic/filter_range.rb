module Elastic
  module FilterRange
    module InstanceMethods
      def range(field, from, to)
        if from && to
          if from <= to
            {
              "range" => {
                "#{field}" => { "gte" => from, "lte" => to }
              }
            }
          else
            {
              "or" => {
                "filters" => [
                  { "range" => { "#{field}" => {"gte" => from } } },
                  { "range" => { "#{field}" => {"lte" => to } } }
                ]
              }
            }
          end
        end
      end
    end

    def self.included(receiver)
      receiver.send :include, InstanceMethods
    end
  end
end
