class EmptyWorker
  include Sidekiq::Worker

  sidekiq_options retry: false, unique: true

  def perform(*args)
    puts args.inspect
  end
end
