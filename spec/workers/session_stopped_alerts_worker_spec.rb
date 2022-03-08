require 'rails_helper'

describe SessionStoppedAlertsWorker do
  it 'sends email alerts to users whose sessions stopped streaming in the last 30 minutes' do
    allow(A9n).to receive(:sidekiq_session_stopped_alerts_enabled).and_return(true)
    allow(Time).to receive(:current).and_return(Time.parse('2010-01-01'))
    user =
      create_user!(session_stopped_alert: true, email: 'useremail@example.com')
    create_session!(
      user: user,
      title: 'Session Title',
      last_measurement_at: Time.current - 35.minutes
    )
    create_session!(last_measurement_at: Time.current - 65.minutes)
    create_session!(last_measurement_at: Time.current - 25.minutes)

    subject.perform

    expect { subject.perform }.to change { ActionMailer::Base.deliveries.count }
      .by(1)
    expect(ActionMailer::Base.deliveries.first.to).to eq(
      %w[useremail@example.com]
    )
    expect(ActionMailer::Base.deliveries.first.subject).to eq(
      'Session Title stopped streaming at 12/31/09 23:25 UTC'
    )
  end
end
