-- Delete orphan conversation and its messages
DELETE FROM messages_inbox WHERE conversation_id = 'e0a63e49-de5e-4d8b-b09a-7fcc92c1b49f';
DELETE FROM messages_outbox WHERE conversation_id = 'e0a63e49-de5e-4d8b-b09a-7fcc92c1b49f';
DELETE FROM conversations WHERE id = 'e0a63e49-de5e-4d8b-b09a-7fcc92c1b49f';