namespace :sessions do
  task merge_airnow_sessions: [:environment] do
    user = User.find_by(username: "US EPA AirNow")

    if user && user.sessions.any?
      sessions_with_coordinates = user.sessions.select(:title, :latitude, :longitude)

      grouped_sessions = sessions_with_coordinates.group_by(&:title).select { |_, v| v.size > 1 }

      lat_lon_tolerance = 0.0002

      grouped_sessions.each do |title, sessions|
        sessions.combination(2).any? do |s1, s2|
          if (s1.latitude - s2.latitude).abs > lat_lon_tolerance || (s1.longitude - s2.longitude).abs > lat_lon_tolerance
            puts "Title: '#{title}' has sessions with latitude or longitude differences exceeding 0.0002"
            break
          end
        end
      end
    else
      puts "No user found or no sessions available"
    end
  end
end
