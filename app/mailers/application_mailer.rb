class ApplicationMailer < ActionMailer::Base
  default from: A9n.mailer_from
  layout 'mailer'
end
