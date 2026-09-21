require 'rails_helper'

RSpec.describe FixedSessions::List do
  let(:user) { create(:user) }

  def sessions_in(result)
    result[:sessions]
  end

  it "returns only the given user's fixed sessions" do
    mine = create(:fixed_session, user: user)
    create(:fixed_session)                        # another user
    create(:mobile_session, user: user)           # not a fixed session

    result = described_class.new(user: user).call

    expect(sessions_in(result).map { |s| s[:uuid] }).to eq([mine.uuid])
  end

  it 'includes deployment metadata, device and per-stream identity (no measurements)' do
    device = create(:device, mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini')
    session = create(:fixed_session, user: user, device: device)
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    row = sessions_in(described_class.new(user: user).call).first

    expect(row).to include(
      :uuid, :title, :version, :time_zone, :start_time, :end_time,
      :last_measurement_at, :is_indoor, :latitude, :longitude, :tag_list, :share_url,
    )
    expect(row[:device]).to eq(mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini', name: nil)
    expect(row[:streams]).to have_key('AirBeamMini-PM2.5')
    expect(row[:streams]['AirBeamMini-PM2.5']).not_to have_key(:measurements)
  end

  describe 'last_measurement' do
    it "reports each stream's newest reading" do
      session = create(:fixed_session, user: user)
      stream = create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
      create(:fixed_measurement, stream: stream, value: 5.0, time_with_time_zone: Time.utc(2026, 8, 14, 10, 0, 0))
      create(:fixed_measurement, stream: stream, value: 12.5, time_with_time_zone: Time.utc(2026, 8, 14, 12, 0, 0))

      row = sessions_in(described_class.new(user: user).call).first

      expect(row[:streams]['AirBeamMini-PM2.5'][:last_measurement]).to eq(
        value: 12.5,
        time: Time.utc(2026, 8, 14, 12, 0, 0).to_i * 1_000,
      )
    end

    it 'keeps each stream on its own reading' do
      session = create(:fixed_session, user: user)
      pm = create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
      rh = create(:stream, session: session, sensor_name: 'AirBeamMini-RH')
      create(:fixed_measurement, stream: pm, value: 12.5, time_with_time_zone: Time.utc(2026, 8, 14, 12, 0, 0))
      create(:fixed_measurement, stream: rh, value: 48.0, time_with_time_zone: Time.utc(2026, 8, 14, 11, 0, 0))

      streams = sessions_in(described_class.new(user: user).call).first[:streams]

      expect(streams['AirBeamMini-PM2.5'][:last_measurement][:value]).to eq(12.5)
      expect(streams['AirBeamMini-RH'][:last_measurement][:value]).to eq(48.0)
    end

    it 'is null for a sensor that has never reported' do
      session = create(:fixed_session, user: user)
      create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

      row = sessions_in(described_class.new(user: user).call).first

      expect(row[:streams]['AirBeamMini-PM2.5'][:last_measurement]).to be_nil
    end

    it "does not read another user's measurements into the page" do
      session = create(:fixed_session, user: user)
      mine = create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
      theirs = create(:stream, session: create(:fixed_session), sensor_name: 'AirBeamMini-PM2.5')
      create(:fixed_measurement, stream: theirs, value: 99.0)

      row = sessions_in(described_class.new(user: user).call).first

      expect(mine.fixed_measurements).to be_empty
      expect(row[:streams]['AirBeamMini-PM2.5'][:last_measurement]).to be_nil
    end
  end

  describe 'ordering' do
    # Ordering is by id ASC, not start_time_local: id is unique, so a page
    # boundary can never split or duplicate a tie.
    it 'returns oldest-created first' do
      first  = create(:fixed_session, user: user)
      second = create(:fixed_session, user: user)
      third  = create(:fixed_session, user: user)

      result = sessions_in(described_class.new(user: user).call)

      expect(result.map { |s| s[:uuid] }).to eq([first.uuid, second.uuid, third.uuid])
    end

    it 'partitions cleanly across pages' do
      created = create_list(:fixed_session, 5, user: user)

      page1 = sessions_in(described_class.new(user: user, page: 1, per_page: 2).call)
      page2 = sessions_in(described_class.new(user: user, page: 2, per_page: 2).call)
      page3 = sessions_in(described_class.new(user: user, page: 3, per_page: 2).call)

      uuids = (page1 + page2 + page3).map { |s| s[:uuid] }
      expect(uuids).to eq(created.map(&:uuid))
      expect(uuids.uniq).to eq(uuids)
    end
  end

  # A client walking the pages treats a session absent from the whole walk as
  # deleted server-side, so anything the walk silently skips gets dropped.
  describe 'writes landing between two pages of a walk' do
    def walk(per_page:, after_first_page:)
      seen = []
      page = 1
      loop do
        rows = sessions_in(described_class.new(user: user, page: page, per_page: per_page).call)
        seen.concat(rows.map { |s| s[:uuid] })
        break if rows.empty?

        after_first_page.call if page == 1
        page += 1
      end
      seen
    end

    it 'does not skip or repeat a session when one is created mid-walk' do
      existing = create_list(:fixed_session, 5, user: user)

      seen = walk(per_page: 2, after_first_page: -> { create(:fixed_session, user: user) })

      expect(seen).to include(*existing.map(&:uuid))
      expect(seen.uniq).to eq(seen)
      # Ascending puts the new id past the cursor, so the walk still reaches it.
      expect(seen).to eq(user.fixed_sessions.order(:id).pluck(:uuid))
    end
  end

  describe 'meta' do
    it 'reports the full total, not the page size' do
      create_list(:fixed_session, 5, user: user)

      meta = described_class.new(user: user, page: 1, per_page: 2).call[:meta]

      expect(meta).to eq(total: 5, page: 1, per_page: 2, total_pages: 3)
    end

    it 'counts only the requesting user, ignoring the page window' do
      create_list(:fixed_session, 3, user: user)
      create_list(:fixed_session, 2)           # another user
      create(:mobile_session, user: user)      # not a fixed session

      expect(described_class.new(user: user).call[:meta][:total]).to eq(3)
    end

    it 'reports zero pages for a user with no sessions' do
      result = described_class.new(user: user).call

      expect(result[:sessions]).to eq([])
      expect(result[:meta]).to eq(total: 0, page: 1, per_page: described_class::DEFAULT_PER_PAGE, total_pages: 0)
    end

    it 'keeps total honest on a page past the end' do
      create_list(:fixed_session, 3, user: user)

      result = described_class.new(user: user, page: 99, per_page: 2).call

      expect(result[:sessions]).to eq([])
      expect(result[:meta]).to eq(total: 3, page: 99, per_page: 2, total_pages: 2)
    end
  end

  describe 'defaults' do
    it 'defaults to page 1 and DEFAULT_PER_PAGE when neither is given' do
      create_list(:fixed_session, 3, user: user)

      result = described_class.new(user: user).call

      expect(sessions_in(result).size).to eq(3)
      expect(result[:meta][:page]).to eq(1)
      expect(result[:meta][:per_page]).to eq(described_class::DEFAULT_PER_PAGE)
    end

    it 'honours page when per_page is omitted' do
      create_list(:fixed_session, 3, user: user)

      result = described_class.new(user: user, page: 2).call

      expect(sessions_in(result)).to eq([])
      expect(result[:meta][:page]).to eq(2)
    end

    # The contract rejects junk before it reaches here; this guards the
    # non-HTTP callers it does not sit in front of.
    it 'falls back to the default rather than half-reading a junk per_page' do
      create_list(:fixed_session, 3, user: user)

      result = described_class.new(user: user, per_page: '10abc').call

      expect(result[:meta][:per_page]).to eq(described_class::DEFAULT_PER_PAGE)
    end

    it 'falls back to page 1 rather than half-reading a junk page' do
      create_list(:fixed_session, 3, user: user)

      result = described_class.new(user: user, page: '2nope', per_page: 2).call

      expect(result[:meta][:page]).to eq(1)
      expect(sessions_in(result).size).to eq(2)
    end

    it 'caps per_page at MAX_PER_PAGE even if the caller asks for more' do
      create_list(:fixed_session, 3, user: user)

      result = described_class.new(user: user, per_page: 10_000).call

      expect(result[:meta][:per_page]).to eq(described_class::MAX_PER_PAGE)
    end
  end

  describe 'query count' do
    # Every stream on the page resolves its newest reading, and the tag list and
    # thresholds come off preloads. Cost must not grow with the page.
    def count_queries
      queries = []
      sub = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
        queries << payload[:sql] unless payload[:name].to_s =~ /SCHEMA|TRANSACTION/
      end
      yield
      queries
    ensure
      ActiveSupport::Notifications.unsubscribe(sub)
    end

    def build_sessions(count)
      count.times.map do |i|
        session = create(:fixed_session, user: user)
        stream = create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
        create(:fixed_measurement, stream: stream)
        session.tag_list.add("tag#{i}")
        session.save!
        session
      end
    end

    it 'issues the same number of queries for 1 session and for 10' do
      build_sessions(1)
      one = count_queries { described_class.new(user: user).call }

      build_sessions(9)
      ten = count_queries { described_class.new(user: user).call }

      expect(ten.size).to eq(one.size),
                          "expected a constant query count, got #{one.size} for 1 session " \
                          "and #{ten.size} for 10:\n#{ten.join("\n")}"
    end

    it 'renders tag_list off the preloaded association' do
      create(:fixed_session, user: user, tag_list: 'rooftop, pm')

      row = sessions_in(described_class.new(user: user).call).first

      expect(row[:tag_list].split(/,\s*/)).to match_array(%w[rooftop pm])
    end

    it 'renders an empty string for an untagged session' do
      create(:fixed_session, user: user, tag_list: '')

      row = sessions_in(described_class.new(user: user).call).first

      expect(row[:tag_list]).to eq('')
    end
  end
end
