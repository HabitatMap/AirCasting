require 'rails_helper'

describe SessionStoppedAlertsWorker do
  it 'sends email alerts to users whose sessions stopped streaming in the last 30 minutes' do
    ActiveJob::Base.queue_adapter = :test

    allow(A9n).to receive(:sidekiq_session_stopped_alerts_enabled).and_return(true)
    allow(Time).to receive(:current).and_return(Time.parse('2010-01-01'))
    user =
      create_user!(session_stopped_alert: true, email: 'useremail@example.com')
    create_session!(
      user: user,
      type: 'FixedSession',
      title: 'Session Title',
      last_measurement_at: Time.current - 35.minutes
    )
    create_session!(type: 'FixedSession', last_measurement_at: Time.current - 65.minutes)
    create_session!(type: 'FixedSession', last_measurement_at: Time.current - 25.minutes)

    expect { subject.perform }.to have_enqueued_mail(UserMailer, :session_stopped_email)
  end

  # A stop-alert answers "your monitor went quiet", which is a fixed-session
  # question. Mobile rows only stay out of the window today because their
  # last_measurement_at is NULL and NULL fails BETWEEN; once it is populated,
  # every mobile user with the toggle on would be mailed after every recording.
  # The toggle is live in both apps, so this has to be a type filter, not an
  # accident of the data.
  it 'ignores mobile sessions even when their last_measurement_at is in the window' do
    ActiveJob::Base.queue_adapter = :test

    allow(A9n).to receive(:sidekiq_session_stopped_alerts_enabled).and_return(true)
    allow(Time).to receive(:current).and_return(Time.parse('2010-01-01'))
    user =
      create_user!(session_stopped_alert: true, email: 'mobile@example.com')
    create_session!(
      user: user,
      type: 'MobileSession',
      title: 'Bike ride',
      last_measurement_at: Time.current - 35.minutes
    )

    expect { subject.perform }.not_to have_enqueued_mail(UserMailer, :session_stopped_email)
  end
end
