require 'spec_helper'

describe 'routing to user sessions' do
  describe '/api/user/sessions/sync' do
    subject { { post: '/api/user/sessions/sync' } }

    it do
      is_expected.to route_to(
        { controller: 'api/user_sessions', action: 'sync' }
      )
    end
  end
end
