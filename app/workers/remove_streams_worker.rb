class RemoveStreamsWorker
  include Sidekiq::Worker

  def perform(session_id)
    Stream.where(session_id: session_id).destroy_all
  end
end
