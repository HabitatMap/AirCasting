module CanonicalHelper
  def canonical_link_tag
    return unless request
    path = request.path
    canonical_url = File.join(ENV['BASE_URL'].to_s, path)
    tag.link(rel: 'canonical', href: canonical_url)
  end
end
