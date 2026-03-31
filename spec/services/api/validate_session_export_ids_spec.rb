# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::ValidateSessionExportIds do
  describe '.call' do
    it 'rejects empty id list' do
      result = described_class.call(session_ids: [])

      expect(result.success?).to be false
      expect(result.errors[:session_ids]).to include('must include at least one session')
    end

    it 'rejects unknown session ids' do
      result = described_class.call(session_ids: [9_999_999_999])

      expect(result.success?).to be false
      expect(result.errors[:session_ids]).to include('unknown session ids')
    end

context 'mobile sessions' do
      it 'allows up to SESSION_IDS_MAX_STANDARD' do
        stub_const('Api::ExportLimits::SESSION_IDS_MAX_STANDARD', 2)
        s1 = create(:mobile_session)
        s2 = create(:mobile_session)

        result = described_class.call(session_ids: [s1.id, s2.id])

        expect(result.success?).to be true
      end

      it 'rejects more than SESSION_IDS_MAX_STANDARD' do
        stub_const('Api::ExportLimits::SESSION_IDS_MAX_STANDARD', 2)
        sessions = create_list(:mobile_session, 3)

        result = described_class.call(session_ids: sessions.map(&:id))

        expect(result.success?).to be false
        expect(result.errors[:session_ids].first).to include('cannot export more than 2')
      end
    end

    context 'fixed sessions' do
      it 'rejects when streams are missing' do
        fs = create(:fixed_session)

        result = described_class.call(session_ids: [fs.id])

        expect(result.success?).to be false
        expect(result.errors[:session_ids]).to include('fixed sessions must include streams')
      end

      it 'allows air streams up to SESSION_IDS_MAX_FIXED_AIR' do
        stub_const('Api::ExportLimits::SESSION_IDS_MAX_FIXED_AIR', 2)
        fs1 = create(:fixed_session)
        fs2 = create(:fixed_session)
        create(:stream, :fixed, session: fs1, sensor_name: 'AirBeam2-PM2.5')
        create(:stream, :fixed, session: fs2, sensor_name: 'AirBeam2-PM2.5')

        result = described_class.call(session_ids: [fs1.id, fs2.id])

        expect(result.success?).to be true
      end

      it 'rejects more air fixed sessions than SESSION_IDS_MAX_FIXED_AIR' do
        stub_const('Api::ExportLimits::SESSION_IDS_MAX_FIXED_AIR', 2)
        sessions = create_list(:fixed_session, 3)
        sessions.each do |fs|
          create(:stream, :fixed, session: fs, sensor_name: 'AirBeam2-PM2.5')
        end

        result = described_class.call(session_ids: sessions.map(&:id))

        expect(result.success?).to be false
        expect(result.errors[:session_ids].first).to include('cannot export more than 2')
      end

      it 'allows government streams up to SESSION_IDS_MAX_STANDARD' do
        stub_const('Api::ExportLimits::SESSION_IDS_MAX_STANDARD', 2)
        fs1 = create(:fixed_session)
        fs2 = create(:fixed_session)
        create(:stream, :fixed, session: fs1, sensor_name: 'government-pm2.5')
        create(:stream, :fixed, session: fs2, sensor_name: 'government-pm2.5')

        result = described_class.call(session_ids: [fs1.id, fs2.id])

        expect(result.success?).to be true
      end

      it 'rejects mixed mobile and fixed' do
        ms = create(:mobile_session)
        fs = create(:fixed_session)
        create(:stream, :fixed, session: fs, sensor_name: 'AirBeam2-PM2.5')

        result = described_class.call(session_ids: [ms.id, fs.id])

        expect(result.success?).to be false
        expect(result.errors[:session_ids]).to include(
          'cannot mix mobile and fixed sessions in one export',
        )
      end

      it 'rejects fixed batch mixing gov and air categories' do
        fs1 = create(:fixed_session)
        fs2 = create(:fixed_session)
        create(:stream, :fixed, session: fs1, sensor_name: 'government-pm2.5')
        create(:stream, :fixed, session: fs2, sensor_name: 'AirBeam2-PM2.5')

        result = described_class.call(session_ids: [fs1.id, fs2.id])

        expect(result.success?).to be false
        expect(result.errors[:session_ids]).to include('cannot mix fixed session export types')
      end

      it 'rejects inconsistent streams within one fixed session' do
        fs = create(:fixed_session)
        create(:stream, :fixed, session: fs, sensor_name: 'government-pm2.5')
        create(:stream, :fixed, session: fs, sensor_name: 'AirBeam2-PM2.5')

        result = described_class.call(session_ids: [fs.id])

        expect(result.success?).to be false
        expect(result.errors[:session_ids]).to include('inconsistent sensor types within a session')
      end
    end
  end
end
