require 'spec_helper'

describe 'routing to sessions' do
  it 'it routes /s/:url_token to measurement_sessions#show_old for url_token' do
    expect({ get: '/s/ab4c5' }).to route_to(
      controller: 'measurement_sessions',
      action: 'show_old',
      url_token: 'ab4c5'
    )
  end
end
