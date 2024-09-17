class TagsRepository
  def sessions_tags(session_ids:, input:)
    sql = <<-SQL
      SELECT name
      FROM (
        SELECT DISTINCT tags.name,
          CASE
            WHEN tags.name ~ '^[a-zA-Z]' THEN '0' || LOWER(tags.name)
            ELSE '1' || LOWER(tags.name)
          END AS sort_key
        FROM tags
        JOIN taggings ON tags.id = taggings.tag_id
        WHERE taggings.taggable_type = 'Session'
          AND taggings.taggable_id IN (#{session_ids.join(',')})
          AND tags.name ILIKE ?
      ) AS distinct_tags
      ORDER BY sort_key
    SQL

    ActiveRecord::Base.connection.exec_query(
      ActiveRecord::Base.send(:sanitize_sql_array, [sql, "#{input}%"])
    )
  end
end
