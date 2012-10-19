module AirCasting
  module UsernameParam
    # "fo bo  , do," => ['fo bo', 'do']
    def self.split(usernames)
      usernames.to_s.split(/\s*,\s*/)
    end
  end
end
