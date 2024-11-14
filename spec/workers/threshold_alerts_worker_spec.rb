require 'rails_helper'

describe ThresholdAlertsWorker do
  ActiveJob::Base.queue_adapter = :test

  let(:user) { create_user!(email: 'user@ex.com') }
  let(:session) { create_session!(user: user, title: 'Session Title') }
  let(:stream) { create_stream!(session: session, sensor_name: 'PM2.5') }
  let(:timezone_offset) { -18_000 }

  before do
    allow(A9n).to receive(:sidekiq_threshold_exceeded_alerts_enabled)
      .and_return(true)
  end

  context 'when measurement exceeds threshold value' do
    context 'when time passed since last email > frequency' do
      let!(:alert) do
        ThresholdAlert.create(
          user: user,
          session_uuid: session.uuid,
          sensor_name: stream.sensor_name,
          threshold_value: 10,
          frequency: 1,
          last_email_at: Time.current - 70.minutes,
          timezone_offset: timezone_offset,
        )
      end
      let!(:measurement) do
        create_measurement!(
          stream: stream,
          time: Time.current + timezone_offset,
          value: 20,
        )
      end

      it 'sends alert email' do
        expect { subject.perform }.to have_enqueued_mail(
          UserMailer,
          :threshold_exceeded_email,
        )
      end
    end

    context 'when time passed since last email < frequency' do
      let!(:alert) do
        ThresholdAlert.create(
          user: user,
          session_uuid: session.uuid,
          sensor_name: stream.sensor_name,
          threshold_value: 10,
          frequency: 1,
          last_email_at: Time.current - 10.minutes,
          timezone_offset: timezone_offset,
        )
      end
      let!(:measurement) do
        create_measurement!(
          stream: stream,
          time: Time.current + timezone_offset,
          value: 20,
        )
      end

      it 'does not send alert email' do
        expect { subject.perform }.not_to have_enqueued_mail(
          UserMailer,
          :threshold_exceeded_email,
        )
      end
    end
  end
end
