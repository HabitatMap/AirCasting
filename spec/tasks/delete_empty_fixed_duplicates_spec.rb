require 'rails_helper'
require 'rake'

RSpec.describe 'sessions:delete_empty_fixed_duplicates' do
  before(:all) do
    Rake.application.rake_require('tasks/delete_empty_fixed_duplicates', [Rails.root.join('lib').to_s])
    Rake::Task.define_task(:environment)
  end

  let(:task) { Rake::Task['sessions:delete_empty_fixed_duplicates'] }
  let(:user) { create(:user) }
  let(:uuid) { SecureRandom.uuid }

  before { task.reenable }
  after { ENV.delete('APPLY') }

  # Duplicates cannot be made through validations — that is what the bug was.
  def build_copy(attrs = {})
    session = build(:fixed_session, { user: user, uuid: uuid, url_token: SecureRandom.hex(5) }.merge(attrs))
    session.save(validate: false)
    session.update_columns(created_at: 30.days.ago) # past MIN_AGE_DAYS
    session
  end

  context 'when every copy is empty' do
    it 'keeps the oldest and deletes the rest' do
      keeper = build_copy
      build_copy
      build_copy
      ENV['APPLY'] = 'true'

      task.invoke

      expect(Session.where(uuid: uuid).pluck(:id)).to eq([keeper.id])
    end

    it 'writes nothing during a dry run' do
      build_copy
      build_copy

      expect { task.invoke }.to output(/WOULD DELETE/).to_stdout
      expect(Session.where(uuid: uuid).count).to eq(2)
    end

    it 'does not leave a tombstone that would make phones drop the survivor' do
      build_copy
      build_copy
      ENV['APPLY'] = 'true'

      task.invoke

      expect(DeletedSession.where(uuid: uuid, user_id: user.id)).to be_empty
    end
  end

  context 'when a copy holds anything' do
    it 'skips a group where one copy has a stream' do
      keeper = build_copy
      copy = build_copy
      create(:stream, session: copy)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/not empty.*streams=1/m).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([keeper.id, copy.id])
    end

    it 'skips a group where a copy carries a session_token' do
      keeper = build_copy
      copy = build_copy(session_token: SecureRandom.hex(16))
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/not empty.*session_token=1/m).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([keeper.id, copy.id])
    end

    it 'skips a group where a copy has notes' do
      keeper = build_copy
      copy = build_copy
      create(:note, session: copy)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/not empty.*notes=1/m).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([keeper.id, copy.id])
    end

    it 'reports fixed_measurements, which live in their own table' do
      keeper = build_copy
      copy = build_copy
      stream = create(:stream, session: copy)
      create(:fixed_measurement, stream: stream)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/fixed_measurements=1/m).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([keeper.id, copy.id])
    end
  end

  it 'never touches mobile sessions' do
    mobile = build(:mobile_session, user: user, uuid: uuid, url_token: SecureRandom.hex(5))
    mobile.save(validate: false)
    mobile.update_columns(created_at: 30.days.ago)
    mobile_copy = build(:mobile_session, user: user, uuid: uuid, url_token: SecureRandom.hex(5))
    mobile_copy.save(validate: false)
    mobile_copy.update_columns(created_at: 30.days.ago)
    ENV['APPLY'] = 'true'

    task.invoke

    expect(Session.where(uuid: uuid).count).to eq(2)
  end

  it 'skips a uuid shared with a mobile session' do
    fixed_a = build_copy
    fixed_b = build_copy
    mobile = build(:mobile_session, user: user, uuid: uuid, url_token: SecureRandom.hex(5))
    mobile.save(validate: false)
    mobile.update_columns(created_at: 30.days.ago)
    ENV['APPLY'] = 'true'

    expect { task.invoke }.to output(/shared with a mobile session/).to_stdout

    expect(Session.where(uuid: uuid).pluck(:id)).to match_array([fixed_a.id, fixed_b.id, mobile.id])
  end

  it 'survives a failing group, still prints the summary, and counts nothing for it' do
    build_copy
    build_copy
    allow(EmptyFixedSession).to receive(:destroy_session!).and_raise(StandardError, 'boom')
    ENV['APPLY'] = 'true'

    output = capture_stdout { task.invoke }

    expect(output).to match(/nothing was deleted for this group/)
    expect(output).to match(/--- summary ---/)
    expect(output).to match(/sessions deleted: 0/)
    expect(Session.where(uuid: uuid).count).to eq(2)
  end

  it 'skips a group whose sessions are newer than MIN_AGE_DAYS' do
    build_copy
    build_copy.update_columns(created_at: 1.day.ago)
    ENV['APPLY'] = 'true'

    expect { task.invoke }.to output(/setup may still be in progress/).to_stdout

    expect(Session.where(uuid: uuid).count).to eq(2)
  end

  def capture_stdout
    original = $stdout
    $stdout = StringIO.new
    yield
    $stdout.string
  ensure
    $stdout = original
  end
end