require 'rails_helper'

# A single-part HTML mail is a content-filter penalty, and every mail here goes
# to a real person's inbox. These specs pin the multipart shape so a future
# template does not quietly drop back to HTML-only.
describe UserMailer do
  let(:user) { FactoryBot.create(:user, email: 'recipient@example.com') }

  shared_examples 'a multipart mail' do
    it 'carries both a plain-text and an HTML part' do
      expect(mail).to be_multipart
      expect(mail.parts.map(&:mime_type)).to contain_exactly('text/plain', 'text/html')
    end
  end

  describe '#account_delete_email' do
    let(:mail) { described_class.account_delete_email(user.email, '0042') }

    include_examples 'a multipart mail'

    it 'states the code in both parts' do
      mail.parts.each { |part| expect(part.body.to_s).to include('0042') }
    end
  end

  describe '#threshold_exceeded_email' do
    let(:mail) do
      described_class
        .with(user: user, title: 'Backyard', sensor: 'AirBeam-PM2.5')
        .threshold_exceeded_email
    end

    include_examples 'a multipart mail'

    it 'names the sensor and the session in both parts' do
      mail.parts.each do |part|
        expect(part.body.to_s).to include('AirBeam-PM2.5')
        expect(part.body.to_s).to include('Backyard')
      end
    end
  end

  describe '#session_stopped_email' do
    let(:mail) do
      described_class
        .with(user: user, title: 'Backyard', time: '12:00')
        .session_stopped_email
    end

    include_examples 'a multipart mail'
  end
end
