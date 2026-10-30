class SessionsController < Devise::SessionsController
  # `create` is overridden only to skip the "Signed in successfully." flash that
  # Devise's own sets: this redirects to the map, which has nowhere to show it.
  #
  # A failed sign-in never comes back here. `warden.authenticate!` throws, and
  # CustomFailure (config/initializers/devise.rb) overrides Devise's `respond`
  # wholesale, so it redirects a browser to the form with a flash and answers a
  # JSON caller 401. It never reads `warden_options[:recall]`, which is why the
  # `recall: 'sessions#failure'` that used to sit here, and the `failure` action
  # it named, were both dead. spec/requests/user_sign_in_spec.rb pins that.
  def create
    resource = warden.authenticate!(scope: resource_name)
    sign_in_and_redirect(resource_name, resource)
  end

  protected

  # Everything else this controller used to do by hand — signing the resource
  # in, reading `stored_location_for`, falling back to the root path — is what
  # Devise's own `sign_in_and_redirect` and `after_sign_in_path_for` already do.
  # Only the admin destination is ours.
  def after_sign_in_path_for(resource)
    resource.admin? ? admin_root_path : super
  end
end
