select
  meta1.name as parent,
  meta2.name as child
from fields_of_study_v2.field_children
left join fields_of_study_v2.field_meta as meta1
  on field_children.field_id = meta1.field_id
left join fields_of_study_v2.field_meta as meta2
  on child_field_id = meta2.field_id
where (meta1.level = 0) and (meta2.level = 1)
