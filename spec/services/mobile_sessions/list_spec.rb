require 'rails_helper'

RSpec.describe MobileSessions::List do
  let(:user) { create(:user) }

  def sessions_in(result)
    result[:sessions]
  end

  it "returns only the given user's mobile sessions" do
    mine = create(:mobile_session, user: user)
    create(:mobile_session)                       # another user
    create(:fixed_session, user: user)            # not a mobile session

    result = described_class.new(user: user).call

    expect(sessions_in(result).map { |s| s[:uuid] }).to eq([mine.uuid])
  end

  it 'includes metadata, version, device and per-stream aggregates (no measurements)' do
    device = create(:device, mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini')
    session = create(:mobile_session, user: user, device: device)
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    row = sessions_in(described_class.new(user: user).call).first

    expect(row).to include(:uuid, :title, :version, :time_zone, :start_time, :end_time, :tag_list, :share_url)
    expect(row[:device]).to eq(mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini', name: nil)
    expect(row[:streams]).to have_key('AirBeamMini-PM2.5')
    expect(row[:streams]['AirBeamMini-PM2.5']).to include(:measurements_count, :average_value, :min_latitude)
    expect(row[:streams]['AirBeamMini-PM2.5']).not_to have_key(:measurements)
  end

  it 'is null-safe for a stream without measurements yet' do
    session = create(:mobile_session, user: user)
    create(:stream, session: session, average_value: nil)

    expect { described_class.new(user: user).call }.not_to raise_error
  end

  describe 'ordering' do
    # Ordering is by id DESC, not start_time_local: id is unique, so a page
    # boundary can never split or duplicate a tie. start_time_local is NULL for
    # every session that has not uploaded yet, which made every such session a
    # tie with every other.
    it 'returns newest-created first and is stable across equal start times' do
      first  = create(:mobile_session, user: user, start_time_local: nil, end_time_local: nil)
      second = create(:mobile_session, user: user, start_time_local: nil, end_time_local: nil)
      third  = create(:mobile_session, user: user, start_time_local: nil, end_time_local: nil)

      result = sessions_in(described_class.new(user: user).call)

      expect(result.map { |s| s[:uuid] }).to eq([third.uuid, second.uuid, first.uuid])
    end

    it 'partitions cleanly across pages when every session has the same start time' do
      created = create_list(:mobile_session, 5, user: user, start_time_local: nil, end_time_local: nil)

      page1 = sessions_in(described_class.new(user: user, page: 1, per_page: 2).call)
      page2 = sessions_in(described_class.new(user: user, page: 2, per_page: 2).call)
      page3 = sessions_in(described_class.new(user: user, page: 3, per_page: 2).call)

      uuids = (page1 + page2 + page3).map { |s| s[:uuid] }
      expect(uuids).to eq(created.map(&:uuid).reverse)
      expect(uuids.uniq).to eq(uuids)
    end
  end

  describe 'meta' do
    it 'reports the full total, not the page size' do
      create_list(:mobile_session, 5, user: user)

      meta = described_class.new(user: user, page: 1, per_page: 2).call[:meta]

      expect(meta).to eq(total: 5, page: 1, per_page: 2, total_pages: 3)
    end

    it 'counts only the requesting user, ignoring the page window' do
      create_list(:mobile_session, 3, user: user)
      create_list(:mobile_session, 2)          # another user
      create(:fixed_session, user: user)       # not a mobile session

      expect(described_class.new(user: user).call[:meta][:total]).to eq(3)
    end

    it 'reports zero pages for a user with no sessions' do
      result = described_class.new(user: user).call

      expect(result[:sessions]).to eq([])
      expect(result[:meta]).to eq(total: 0, page: 1, per_page: described_class::DEFAULT_PER_PAGE, total_pages: 0)
    end

    it 'keeps total honest on a page past the end' do
      create_list(:mobile_session, 3, user: user)

      result = described_class.new(user: user, page: 99, per_page: 2).call

      expect(result[:sessions]).to eq([])
      expect(result[:meta]).to eq(total: 3, page: 99, per_page: 2, total_pages: 2)
    end
  end

  describe 'defaults' do
    it 'defaults to page 1 and DEFAULT_PER_PAGE when neither is given' do
      create_list(:mobile_session, 3, user: user)

      result = described_class.new(user: user).call

      expect(sessions_in(result).size).to eq(3)
      expect(result[:meta][:page]).to eq(1)
      expect(result[:meta][:per_page]).to eq(described_class::DEFAULT_PER_PAGE)
    end

    it 'honours page when per_page is omitted' do
      create_list(:mobile_session, 3, user: user)

      result = described_class.new(user: user, page: 2).call

      expect(sessions_in(result)).to eq([])
      expect(result[:meta][:page]).to eq(2)
    end

    it 'paginates when per_page is given' do
      create_list(:mobile_session, 3, user: user)

      expect(sessions_in(described_class.new(user: user, page: 1, per_page: 2).call).size).to eq(2)
      expect(sessions_in(described_class.new(user: user, page: 2, per_page: 2).call).size).to eq(1)
    end

    it 'caps per_page at MAX_PER_PAGE even if the caller asks for more' do
      create_list(:mobile_session, 3, user: user)

      result = described_class.new(user: user, per_page: 10_000).call

      expect(result[:meta][:per_page]).to eq(described_class::MAX_PER_PAGE)
    end
  end

  describe 'query count' do
    # `tag_list` used to build a fresh scope per session, so the eager-loaded
    # :tags association was thrown away and every session cost two extra
    # queries. Guard against the regression: cost must not grow with the page.
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
        session = create(:mobile_session, user: user)
        create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
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

    it 'still renders tag_list correctly off the preloaded association' do
      create(:mobile_session, user: user, tag_list: 'bike, commute')

      row = sessions_in(described_class.new(user: user).call).first

      expect(row[:tag_list].split(/,\s*/)).to match_array(%w[bike commute])
    end

    it 'renders byte-for-byte what Session#tag_list did before the preload fix' do
      session = create(:mobile_session, user: user, tag_list: 'bike, commute, morning')

      row = sessions_in(described_class.new(user: user).call).first

      expect(row[:tag_list]).to eq(session.reload.tag_list.to_s)
    end

    it 'renders an empty string for an untagged session' do
      create(:mobile_session, user: user, tag_list: '')

      row = sessions_in(described_class.new(user: user).call).first

      expect(row[:tag_list]).to eq('')
    end
  end
end
