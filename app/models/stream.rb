class Stream < ActiveRecord::Base
	belongs_to :session

	has_many :measurements, :dependent => :destroy

	delegate :size, :to => :measurements

	def as_json(opts=nil)
		opts ||= {}

		methods = opts[:methods] || []
		methods += [:size]

		super(opts.merge(:methods => methods))
	end

end