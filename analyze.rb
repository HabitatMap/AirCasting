#!/usr/bin/env ruby

File.open("Gemfile", File::RDWR|File::CREAT, 0644) do |f|
  gems = f.read
  missing_gems = %w(flog rails_best_practices churn flay).select{ |gem| !gems.include?(gem) }
  unless missing_gems.empty?
    result_text = "\ngroup :development do\n"
    missing_gems.each do |missing_gem|
      result_text << "  gem('#{missing_gem}', :require => nil)\n"
    end
    result_text << "end\n"
    f.write(result_text)
  end
end

File.open(".gitignore", File::RDWR|File::CREAT, 0644) do |f|
  ignored = f.read
  missing = %w(analyzing/ config/rails_best_practices.yml).select{ |missed| !ignored.include?(missed) }
  unless missing.empty?
    result_text = "\n"
    missing.each do |missed|
      result_text << "#{missed}\n"
    end
    f.write(result_text)
  end
end

`bundle install`
`mkdir -p analyzing`
`find app lib  -name \\*.rb | xargs bundle exec flog > analyzing/tortured_code.md`
`bundle exec rails_best_practices -g`
`bundle exec rails_best_practices -f html .`
`mv -f rails_best_practices_output.html analyzing/ `
`bundle exec flay lib/**/*.rb app/**/*.rb > analyzing/duplicates.md`
`bundle exec churn >  analyzing/often_modified.md`

