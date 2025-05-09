require 'rails_helper'

shared_examples_for 'session creation' do
  let(:session) { double('session', notes: [note]) }
  let(:note) { FactoryBot.create(:note, :with_photo, number: 10) }
  let(:photo) { File.new(Rails.root + 'spec' + 'fixtures' + 'test.jpg') }
  let(:photos) { 'some_files' }

  context 'when session creation fails' do
    let(:create_result) { nil }

    it { is_expected.to respond_with(:bad_request) }
  end

  context 'when session creation succeeds' do
    let(:create_result) { session }

    it { is_expected.to respond_with(:ok) }

    it 'returns JSON with location of created session' do
      expect(json_response).to have_key('location')
    end

    it 'returns JSON with locations of note photos' do
      expected_photo_location =
        Rails.application.routes.url_helpers.rails_representation_url(
          note.s3_photo.variant(resize_to_limit: [600, 600]).processed,
          host: A9n.host_,
        )
      expect(json_response['notes'].first).to eq(
        {
          'photo_location' => expected_photo_location,
          'number' => note.number,
        },
      )
    end
  end
end

describe Api::MeasurementSessionsController do
  let(:user) { FactoryBot.create(:user) }

  before { sign_in user }

  describe "POST 'create'" do
    let(:builder) { double }
    let(:data) { { type: 'MobileSession' } }

    before do
      expect(ActiveSupport::JSON).to receive(:decode)
        .with('session')
        .and_return(data)
      expect(SessionBuilder).to receive(:new)
        .with(data, 'some_files', user)
        .and_return(builder)
      expect(builder).to receive(:build!).and_return(create_result)
    end

    context 'when the session is sent without compression' do
      before do
        post :create,
             format: :json,
             params: {
               session: 'session',
               compression: false,
               photos: photos,
             }
      end

      it_should_behave_like 'session creation'
    end

    context 'when the session is sent compressed' do
      before do
        expect(Base64).to receive(:decode64)
          .with('zipped_and_encoded')
          .and_return('zipped')
        expect(AirCasting::GZip).to receive('inflate')
          .with('zipped')
          .and_return('session')

        post :create,
             format: :json,
             params: {
               session: 'zipped_and_encoded',
               compression: true,
               photos: photos,
             }
      end

      it_should_behave_like 'session creation'
    end
  end
end
