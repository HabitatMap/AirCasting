require 'rails_helper'

describe ThresholdAlertsWorker do
  ActiveJob::Base.queue_adapter = :test

  let(:user) { create_user!(email: 'user@ex.com') }
  let(:session) { create_session!(user: user, title: 'Session Title') }
  let(:stream) { create_stream!(session: session, sensor_name: 'PM2.5') }
  let(:timezone_offset) { -18_000 }
  let(:current_time) { Time.current }

  before { allow(Time).to receive(:current).and_return(current_time) }

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
          last_email_at: current_time - 70.minutes,
          last_check_at: current_time - 10.minutes,
          timezone_offset: timezone_offset,
          stream: stream,
        )
      end
      let!(:measurement) do
        create_measurement!(
          stream: stream,
          time: current_time + timezone_offset,
          time_with_time_zone: current_time - 20.minutes,
          value: 20,
        )
      end

      it 'sends alert email' do
        expect { subject.perform }.to have_enqueued_mail(
          UserMailer,
          :threshold_exceeded_email,
        )
      end

      context 'when measurement is exactly at the comparison time' do
        let!(:alert) do
          ThresholdAlert.create(
            user: user,
            session_uuid: session.uuid,
            sensor_name: stream.sensor_name,
            threshold_value: 10,
            frequency: 1,
            last_email_at: current_time - 70.minutes,
            last_check_at: current_time - 10.minutes,
            timezone_offset: timezone_offset,
            stream: stream,
          )
        end
        let!(:measurement) do
          create_measurement!(
            stream: stream,
            time: current_time + timezone_offset,
            time_with_time_zone: alert.last_check_at,
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

      context 'when measurement is exactly at threshold value' do
        let!(:alert) do
          ThresholdAlert.create(
            user: user,
            session_uuid: session.uuid,
            sensor_name: stream.sensor_name,
            threshold_value: 10,
            frequency: 1,
            last_email_at: current_time - 70.minutes,
            last_check_at: current_time - 10.minutes,
            timezone_offset: timezone_offset,
            stream: stream,
          )
        end
        let!(:measurement) do
          create_measurement!(
            stream: stream,
            time: current_time + timezone_offset,
            time_with_time_zone: current_time - 20.minutes,
            value: 10,
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

    context 'when time passed since last email < frequency' do
      let!(:alert) do
        ThresholdAlert.create(
          user: user,
          session_uuid: session.uuid,
          sensor_name: stream.sensor_name,
          threshold_value: 10,
          frequency: 1,
          last_email_at: current_time - 10.minutes,
          last_check_at: current_time - 5.minutes,
          timezone_offset: timezone_offset,
          stream: stream,
        )
      end
      let!(:measurement) do
        create_measurement!(
          stream: stream,
          time: current_time + timezone_offset,
          time_with_time_zone: current_time - 20.minutes,
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

    context 'when time passed since last email is exactly at frequency' do
      let!(:alert) do
        ThresholdAlert.create(
          user: user,
          session_uuid: session.uuid,
          sensor_name: stream.sensor_name,
          threshold_value: 10,
          frequency: 1,
          last_email_at: current_time - 60.minutes,
          last_check_at: current_time - 10.minutes,
          timezone_offset: timezone_offset,
          stream: stream,
        )
      end
      let!(:measurement) do
        create_measurement!(
          stream: stream,
          time: current_time + timezone_offset,
          time_with_time_zone: current_time - 20.minutes,
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
  end

  context 'when measurements do not exceed threshold value' do
    let!(:alert) do
      ThresholdAlert.create(
        user: user,
        session_uuid: session.uuid,
        sensor_name: stream.sensor_name,
        threshold_value: 30,
        frequency: 1,
        last_email_at: current_time - 70.minutes,
        last_check_at: current_time - 10.minutes,
        timezone_offset: timezone_offset,
        stream: stream,
      )
    end
    let!(:measurement) do
      create_measurement!(
        stream: stream,
        time: current_time + timezone_offset,
        time_with_time_zone: current_time - 20.minutes,
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
