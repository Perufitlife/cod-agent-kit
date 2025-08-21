-- Delete the orphaned conversation that was left behind
DELETE FROM conversations 
WHERE id = '620bbed3-63e8-429b-af0d-c5f78b6dc4c3' 
  AND tenant_id = '00000000-0000-0000-0000-000000000001'
  AND order_id IS NULL;