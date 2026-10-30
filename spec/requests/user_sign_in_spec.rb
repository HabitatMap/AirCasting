require 'rails_helper'

# `SessionsController` had no spec of any kind, so nothing pinned either the
# destination or the failure path. The failure examples matter most: the
# behaviour there comes from `CustomFailure`, not from this controller, and it
# is not what reading the controller suggests.
describe 'POST /users/sign_in', type: :request do
  let(:password) { 'password123' }

  let!(:user) do
    User.create!(
      username: 'signer',
      email: 'signer@example.com',
      password: password,
      password_confirmation: password,
    )
  end

  def sign_in_with(email: user.email, pass: password, **options)
    post user_session_path, params: { user: { email: email, password: pass } }, **options
  end

  # CustomFailure builds its Location from `default_url_options` (localhost in
  # test), while the request host is www.example.com, so `redirect_to` cannot
  # match it. Compare the path, which is the part under test.
  def redirect_path
    URI.parse(response.headers['Location']).path
  end

  describe 'a browser form post, which is the only live caller' do
    it 'redirects to the map instead of rendering the JSON body' do
      sign_in_with

      expect(response).to redirect_to('/')
      expect(response.media_type).to eq('text/html')
      expect(response.body).not_to include('success')
    end

    # Devise's `after_sign_in_path_for` consults `stored_location_for`, which is
    # dead in practice: CustomFailure#respond replaces Devise's `redirect`, the
    # only thing that ever calls `store_location!`. So the path is always root.
    it 'always lands on root, since no location is ever stored' do
      get edit_user_registration_path
      sign_in_with

      expect(response).to redirect_to('/')
    end

    it 'signs the user in' do
      sign_in_with
      follow_redirect!

      expect(controller.current_user).to eq(user)
    end
  end

  # The `{success: true, redirect: path}` body this endpoint used to render came
  # from the 2012 Backbone sign-in form (`shared/_login_form.html.haml`, since
  # deleted), which was already commented out at the root commit and whose JS
  # went in b7e008328. No client has asked for it since: Android, iOS and KMP
  # all authenticate with HTTP Basic against `GET /api/user.json`. It is gone,
  # so every caller now gets the same redirect.
  describe 'a JSON caller' do
    it 'gets the redirect too, not a JSON body' do
      sign_in_with(as: :json)

      expect(response).to redirect_to('/')
      expect(response.body).not_to include('success')
    end

    it 'gets the redirect when it sends Accept: */* as well' do
      sign_in_with(headers: { 'Accept' => '*/*' })

      expect(response).to redirect_to('/')
    end
  end

  describe 'an admin' do
    let!(:user) do
      User.create!(
        username: 'boss',
        email: 'boss@example.com',
        password: password,
        password_confirmation: password,
        admin: true,
      )
    end

    it 'lands in ActiveAdmin, ahead of the respond_to' do
      sign_in_with

      expect(response).to redirect_to(admin_root_path)
    end

    it 'lands there for a JSON request too, since the path is format-blind' do
      sign_in_with(as: :json)

      expect(response).to redirect_to(admin_root_path)
    end
  end

  # Everything below is `CustomFailure`, registered as Warden's failure app in
  # config/initializers/devise.rb. It overrides `respond` wholesale and never
  # looks at `warden_options[:recall]`, which is why the controller's
  # `recall: 'sessions#failure'` and its `failure` action were dead code and
  # have been removed. These examples pin the two answers that do happen, so a
  # future `recall:` is not added back on the assumption that it would work.
  describe 'wrong credentials' do
    it 'sends a browser back to the form with a flash, not a JSON body' do
      sign_in_with(pass: 'wrong')

      expect(response).to have_http_status(:found)
      expect(redirect_path).to eq(new_user_session_path)
      expect(flash[:alert]).to eq('Incorrect email or password. Please try again.')
    end

    it 'answers an unknown account identically, so neither is an oracle' do
      sign_in_with(email: 'nobody@example.com', pass: 'wrong')

      expect(response).to have_http_status(:found)
      expect(redirect_path).to eq(new_user_session_path)
      expect(flash[:alert]).to eq('Incorrect email or password. Please try again.')
    end

    it 'answers a JSON caller 401 from CustomFailure' do
      sign_in_with(pass: 'wrong', as: :json)

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to eq(
        'error_code' => 'unauthorized',
        'message' => 'Unauthorized',
      )
    end

    # CustomFailure decides on `request.media_type`, not on Accept or on
    # X-Requested-With, so an XHR and a bare `Accept: */*` both land on the
    # redirect branch. Only a JSON *content type* gets the 401.
    it 'answers every request shape with a redirect or a 401, never a render' do
      {
        'form post' => [{}, :found],
        'json' => [{ as: :json }, :unauthorized],
        'form post sending Accept: */*' => [
          { headers: { 'Accept' => '*/*' } },
          :found,
        ],
        'xhr' => [{ xhr: true }, :found],
      }.each do |shape, (options, status)|
        sign_in_with(pass: 'wrong', **options)

        expect(response).to have_http_status(status), shape
      end
    end
  end
end
