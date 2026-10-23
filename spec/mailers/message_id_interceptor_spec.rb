require 'rails_helper'

describe MessageIdInterceptor do
  let(:user) { FactoryBot.create(:user) }

  before { ActionMailer::Base.deliveries.clear }

  # Without the interceptor the `mail` gem falls back to
  # "<tag@#{Socket.gethostname}.mail>" (mail/utilities.rb:294). The production
  # host is named `localhost`, so mail shipped a Message-ID in a TLD that does
  # not exist.
  it 'stamps the Message-ID with the sending domain, not the machine hostname' do
    UserMailer.account_delete_email(user.email, '0042').deliver_now

    message_id = ActionMailer::Base.deliveries.last.message_id
    expect(message_id).not_to include(Socket.gethostname)
    expect(message_id).not_to include('.mail')
    expect(message_id).to end_with("@#{described_class.message_id_domain}")
  end

  it 'covers Devise mail, which does not descend from ApplicationMailer' do
    user.send_reset_password_instructions

    message_id = ActionMailer::Base.deliveries.last.message_id
    expect(message_id).to end_with("@#{described_class.message_id_domain}")
  end

  it 'gives each message a distinct id' do
    2.times { UserMailer.account_delete_email(user.email, '0042').deliver_now }

    ids = ActionMailer::Base.deliveries.map(&:message_id)
    expect(ids.uniq.size).to eq(2)
  end

  describe '.message_id_domain' do
    # A9n.host_ is bare but carries a port in development, and a colon is not
    # legal in the domain half of a Message-ID.
    it 'drops a port' do
      allow(A9n).to receive(:host_).and_return('localhost:5000')
      expect(described_class.message_id_domain).to eq('localhost')
    end

    it 'falls back when the host is not configured' do
      allow(A9n).to receive(:host_).and_return(nil)
      expect(described_class.message_id_domain).to eq('aircasting.org')
    end
  end
end
