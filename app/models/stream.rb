class Stream < ActiveRecord::Base
	belongs_to :session

	has_many :measurements, :dependent => :destroy
end