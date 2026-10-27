# The `mail` gem builds a Message-ID from the machine's hostname when a mailer
# does not set one — `"<#{Mail.random_tag}@#{::Socket.gethostname}.mail>"`,
# mail-2.8.1/lib/mail/utilities.rb:294. The production host is named
# `localhost`, so every message went out stamped `@localhost.mail`: a domain in
# a TLD that does not exist, matching neither the From address nor anything
# resolvable. Content filters score that, which is the last avoidable spam
# signal left now that SPF, DKIM and DMARC align on aircasting.org.
#
# An interceptor runs immediately before delivery, so this wins over the gem's
# lazy default without each mailer having to remember. It also covers
# Devise::Mailer, which does not descend from ApplicationMailer.
class MessageIdInterceptor
  def self.delivering_email(message)
    message.message_id = "<#{SecureRandom.uuid}@#{message_id_domain}>"
  end

  # `A9n.host_` is bare but may still carry a port in development
  # (`localhost:5000`); a colon is not legal in the domain half of a Message-ID.
  def self.message_id_domain
    A9n.host_.to_s.split(':').first.presence || 'aircasting.org'
  end
end

ActionMailer::Base.register_interceptor(MessageIdInterceptor)
