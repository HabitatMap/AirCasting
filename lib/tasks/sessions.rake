namespace :sessions do

  desc "Reset Counters for sessions"
  task :reset_counters => [:environment] do
    sum = Session.count
    idx = 0
    puts "#{sum} sessions to update:"
    Session.all.each do |session|
      session.measurements_count =  session.measurements.count
      session.save! if session.measurements_count_changed?
      idx = idx + 1
      puts "#{sum - idx} sessions left"
    end
  end
end

