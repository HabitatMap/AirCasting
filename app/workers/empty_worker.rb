class EmptyWorker
  include Sidekiq::Worker

  sidekiq_options retry: false, unique: true,
    unique_unlock_order: :never, unique_job_expiration: 1.minute

  def perform(*args)
    puts args.inspect
  end
end
