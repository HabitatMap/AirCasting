class TestWorker
  include Sidekiq::Worker

  #sidekiq_options lock: :until_executed,
    #log_duplicate: true,
    #on_conflict: :replace

  # this won't help us
  # when sidekiq killed then we can schedule unlimited jobs and they run in parallel ;(
  sidekiq_options lock: :until_and_while_executing,
    log_duplicate: true,
    on_conflict: :log

  def perform
    t = 60*10
    #t = 10
    t.times do |i|
      puts i
      sleep 1
    end
  end
end
