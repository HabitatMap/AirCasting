class UsersRepository
  def save_confirmation_data(user_id:, code:, expiration_date:)
    user = User.find(user_id)
    user.update(deletion_confirm_code: code, deletion_code_valid_until: expiration_date)
  end
end
