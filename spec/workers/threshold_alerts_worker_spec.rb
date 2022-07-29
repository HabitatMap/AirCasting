require 'rails_helper'

describe ThresholdAlertsWorker do
  let(:user)    { create_user!(email: 'user@ex.com') }
  let(:session) { create_session!( user: user, title: 'Session Title') }
  let(:stream)  { create_stream!(session: session, sensor_name: 'PM2.5') }

  context 'when measurement exceeds threshold value' do
    context 'when time passed since last email > frequency' do
      let!(:alert) { ThresholdAlert.create(
                        user: user,
                        session_uuid: session.uuid,
                        sensor_name: stream.sensor_name,
                        threshold_value: 10,
                        frequency: 1,
                        last_email_at: Time.current - 70.minutes) }
      let!(:measurement) { create_measurement!(stream: stream, time: Time.current, value: 20) }

      it 'sends alert email' do
        expect { subject.perform }.to change { ActionMailer::Base.deliveries.count }.by(1)
        expect(ActionMailer::Base.deliveries.first.to).to eq(%w[user@ex.com])
        expect(ActionMailer::Base.deliveries.first.subject).to eq('PM2.5 Threshold Exceeded')
      end
    end

    context 'when time passed since last email < frequency' do
      let!(:alert) { ThresholdAlert.create(
                        user: user,
                        session_uuid: session.uuid,
                        sensor_name: stream.sensor_name,
                        threshold_value: 10,
                        frequency: 1,
                        last_email_at: Time.current - 10.minutes) }
      let!(:measurement) { create_measurement!(stream: stream, time: Time.current, value: 20) }

      it 'does not send alert email' do
        expect { subject.perform }.not_to change { ActionMailer::Base.deliveries.count }
      end
    end
  end
end
