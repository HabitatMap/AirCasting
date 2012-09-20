ActiveAdmin.register User do

  actions :index

  filter :email
  filter :created_at
  filter :last_sign_in_at
  filter :send_emails, :as => :select, :collection => [true, false]

  index do
    column :email
    column :created_at
    column :last_sign_in_at
    column :send_emails
  end
end
