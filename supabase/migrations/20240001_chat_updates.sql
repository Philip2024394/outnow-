-- Chat schema updates: nullable text, image/contact columns, unlocked_at

-- messages.text is now optional (images and contact cards have no text)
ALTER TABLE messages ALTER COLUMN text DROP NOT NULL;

-- Image message support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url text;

-- Contact card message support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contact_type text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contact_value text;

-- Like support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS liked boolean NOT NULL DEFAULT false;

-- Track when a conversation was unlocked (for 30-day history countdown)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unlocked_at timestamptz;

-- Update the on_new_message trigger function:
-- - Removes the old 10-minute expiry logic
-- - Handles null text for image/contact messages (shows emoji placeholder)
CREATE OR REPLACE FUNCTION on_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  preview text;
  is_a    boolean;
BEGIN
  -- Build a preview string
  IF NEW.image_url IS NOT NULL THEN
    preview := '📷 Photo';
  ELSIF NEW.contact_type IS NOT NULL THEN
    preview := '📋 ' || NEW.contact_type;
  ELSE
    preview := left(NEW.text, 80);
  END IF;

  -- Determine which side is the sender
  SELECT (user_a_id = NEW.sender_id)
    INTO is_a
    FROM conversations
   WHERE id = NEW.conversation_id;

  -- Update last_message and increment the OTHER side's unread count
  IF is_a THEN
    UPDATE conversations
       SET last_message    = preview,
           last_message_at = NEW.created_at,
           unread_b        = unread_b + 1
     WHERE id = NEW.conversation_id;
  ELSE
    UPDATE conversations
       SET last_message    = preview,
           last_message_at = NEW.created_at,
           unread_a        = unread_a + 1
     WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger is attached (idempotent)
DROP TRIGGER IF EXISTS trg_on_new_message ON messages;
CREATE TRIGGER trg_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION on_new_message();
