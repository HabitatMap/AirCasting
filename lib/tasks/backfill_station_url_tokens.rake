# Gives every station stored before `stations.url_token` existed a share token,
# so `/g/:url_token` resolves for all of them and not only for stations a site
# list has described since the column landed.
#
#   bundle exec rake stations:backfill_url_tokens DRY_RUN=1
#   bundle exec rake stations:backfill_url_tokens
#
# `StationsUpserter` writes a token on insert only — `upsert_stations` leaves
# url_token out of `update_only` so a live share link can never rotate — which
# is exactly why already-stored stations need this one-off pass.
#
# A rake task, not a migration: a migration holds its transaction open for the
# whole run and cannot be paused or resumed. Resumable by construction —
# `url_token IS NULL` is removed by the UPDATE that matches it, so a killed run
# continues where it stopped with no bookkeeping.
#
# The unique index is the authority, not the probe: two runs racing, or a
# concurrent ETL insert, can both pass `station_url_token_available?` and only
# one can win. RecordNotUnique is retried rather than raised.
namespace :stations do
  desc 'Backfill stations.url_token for stations stored before the column existed'
  task backfill_url_tokens: :environment do
    dry_run = ENV['DRY_RUN'].present?
    batch_size = Integer(ENV.fetch('BATCH_SIZE', 500))
    pause = Float(ENV.fetch('SLEEP', 0.1))
    generator = TokenGenerator.new
    repository = GovernmentSources::Repository.new

    pending = Station.where(url_token: nil).count
    puts "stations without a url_token: #{pending}"
    next if pending.zero?

    if dry_run
      puts 'DRY_RUN set, nothing written'
      next
    end

    written = 0
    Station.where(url_token: nil).in_batches(of: batch_size) do |batch|
      batch.each do |station|
        attempts = 0
        begin
          token =
            generator.generate_unique(
              GovernmentSources::StationsUpserter::URL_TOKEN_LENGTH,
            ) { |candidate| repository.station_url_token_available?(candidate) }
          # update_columns: no validations, no callbacks, no updated_at churn
          # on a column nothing derives from.
          station.update_columns(url_token: token)
          written += 1
        rescue ActiveRecord::RecordNotUnique
          attempts += 1
          raise if attempts >= 5

          retry
        end
      end

      puts "#{written}/#{pending}"
      sleep pause
    end

    puts "done, #{written} written"
  end
end
