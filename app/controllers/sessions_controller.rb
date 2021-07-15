class SessionsController < Devise::SessionsController
  def create
    resource =
      warden.authenticate!(scope: resource_name, recall: 'sessions#failure')
    return sign_in_and_redirect(resource_name, resource)
  end

  # if user is admin then redirect to active admin root else render json
  def sign_in_and_redirect(resource_or_scope, resource = nil)
    scope = Devise::Mapping.find_scope!(resource_or_scope)
    resource ||= resource_or_scope
    sign_in(scope, resource) unless warden.user(scope) == resource
    if resource.admin?
      redirect_to admin_root_path
    else
      return(
        render json: {
                 success: true,
                 redirect:
                   stored_location_for(scope) ||
                     after_sign_in_path_for(resource)
               }
      )
    end
  end

  def failure
    return render json: { success: false, errors: ['Login failed.'] }
  end
end
