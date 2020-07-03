require 'sidekiq-scheduler'

class OpenAqImportMeasurementsWorker
  include Sidekiq::Worker

  # At most one instance of OpenAqImportMeasurementsWorker must be run at once.
  #
  # If two or more instances of OpenAqImportMeasurementsWorker were to overlap and
  # run concurrently, they would insert duplicate sessions, streams and
  # measurements into the database.
  # That could happen either by processing the same measurement file from AWS S3 or
  # different ones where file_1 and file_2 contain measurements belonging to the same
  # session and stream.
  #
  # Whenever `OpenAq::SaveMeasurements` detects duplicate sessions, streams or measurements,
  # in the database it raises an error. That means duplications should always be detected.
  # Unfortunately, files containing measurements belonging to sessions and streams duplicated
  # in the database will not be processed anymore from that point on (because they would always
  # raise). But duplicates should not happen because OpenAqImportMeasurementsWorker runs serially.
  #
  # Unfortunately, we can't use the `:until_executed` lock from sidekiq_unique_jobs because when the
  # Sidekiq server is unexpectedly shut down while this worker is working, the lock will stay in
  # Redis until someone manually removes it.
  #
  # Typically this problem is solved by making sure the lock stays either until the worker finishes
  # or until a certain amount of time passes. [1]
  #
  # Unfortunately again, sidekiq_unique_jobs, unlike the enterprise version of Sidekiq, doesn't
  # support such locking strategy. Instead, we have to hack it ourselves by using the
  # `:until_expired` lock and Sidekiq's API to remove the lock when the worker finishes.
  #
  # `:until_expired` ensures that the lock expires after the time specified through
  # `lock_expiration`. In case Sidekiq is shut down unexpectedly, the lock will eventually expire
  # and Sidekiq will be able to enqueue this worker again.
  #
  # As [1] explains, this method doesn't guarantee uniqueness, but the alternative is having a
  # system that requires a manual intervention after an unexpected restart/shutdown. [2] goes in
  # detail as to why the timeout is required.
  #
  # Another unfortunate side effect of using `:until_expired` is that locks created by it aren't
  # visible through the "Unique Digests" panel in Sidekiq dashboard as well as through
  # `SidekiqUniqueJobs::Digests.all`. But the logs should still show info about skipping the worker
  # because the unique digest being present. Attempting to enqueue the worker from console will
  # return the error as well.
  #
  # One way to guarantee uniqueness for the concurrent inserts would be to use a different
  # architecture (e.g. unique indexes in the database).
  #
  # [1] https://github.com/mperham/sidekiq/wiki/Ent-Unique-Jobs#use
  # [2] https://redis.io/topics/distlock#why-failover-based-implementations-are-not-enough
  sidekiq_options lock: :until_expired,
                  on_conflict: :log,
                  lock_expiration: 30.minutes

  def perform
    started_at = Time.now

    return unless A9n.sidekiq_open_aq_import_measurements_enabled

    OpenAq::ImportMeasurements.new.call
  ensure
    remove_lock(started_at)
  end

  def remove_lock(started_at)
    if !jid
      # Skip lock removal logic in case the worker was executed synchronously (and thus has no jid).
      logger.info "#{
                    self.class.name
                  } was executed synchronously. Skipping lock removal."
      return
    end

    if Time.now - started_at < 5.seconds
      # Sidekiq::Workers data is updated every 5 seconds.
      # https://github.com/mperham/sidekiq/wiki/API#workers
      logger.info 'Sleeping for 5 seconds to wait for Sidekiq workers data to refresh.'
      sleep 5
    end

    current_workers =
      Sidekiq::Workers.new.select do |_, _, work|
        work.fetch('payload').fetch('class') == self.class.name
      end.map { |_, _, work| work }

    if current_workers.size == 1
      # This is the happy path. Only one worker is at work, as it should be.
      digest = current_workers.first.fetch('payload').fetch('unique_digest')
      SidekiqUniqueJobs::Digests.delete_by_digest(digest)
    elsif current_workers.size == 2
      # This can happen if the first worker was enqueued or working for so long that the lock
      # expired and another worker started working. We shouldn't remove the lock here, as the second
      # worker acquired the lock again and should prevent any further workers from being enqueued.
      logger.warn "Detected two active #{
                    self.class.name
                  } workers. Skipping lock removal."
    else
      # Here we deal with either zero workers or more than two workers.
      #
      # We shouldn't ever have zero workers since this code should be called from within an
      # asynchronous Sidekiq worker. So either we had wrong assumptions or Sidekiq's API has
      # changed.
      #
      # Having more than two workers means there's something wrong with our locking logic or it
      # takes workers too much time to go from being enqueued to being finished.
      logger.error "Detected an anomaly: there is #{
                     current_workers.size
                   } active #{self.class.name} workers. Skipping lock removal."
    end
  end
end
