require 'paperclip/url_generator'
require 'cgi'

module Paperclip
  class UrlGenerator
    private

    def escape_url(url)
      CGI.escape(url).gsub('+', '%20')
    end
  end
end
