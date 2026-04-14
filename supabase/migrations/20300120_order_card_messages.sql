-- ── Order card messages ──────────────────────────────────────────────────────
-- Adds order_card JSONB column to messages table.
-- Also makes text nullable (image, contact-reveal, and order card messages have no text)
-- and adds image_url / contact_type / contact_value if not already present.

-- Make text nullable
ALTER TABLE messages
  ALTER COLUMN text DROP NOT NULL;

-- Add columns for rich message types (all idempotent)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url      text,
  ADD COLUMN IF NOT EXISTS contact_type   text,
  ADD COLUMN IF NOT EXISTS contact_value  text,
  ADD COLUMN IF NOT EXISTS order_card     jsonb;

-- Relax the text length check so nullable rows don't fail the constraint
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_text_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_text_check
    CHECK (text IS NULL OR length(text) <= 1000);

-- Update the on_new_message trigger to handle nullable text in last_message
CREATE OR REPLACE FUNCTION on_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  conv conversations%ROWTYPE;
  preview text;
BEGIN
  SELECT * INTO conv FROM conversations WHERE id = new.conversation_id;

  -- Build a human-readable preview for each message type
  preview := CASE
    WHEN new.order_card IS NOT NULL THEN
      COALESCE('🛍️ Order ' || (new.order_card->>'ref'), '🛍️ New order')
    WHEN new.image_url IS NOT NULL THEN '📷 Photo'
    WHEN new.contact_type = 'reveal'  THEN '🔓 Contact details shared'
    WHEN new.contact_type IS NOT NULL THEN '📞 Contact info'
    ELSE COALESCE(new.text, '')
  END;

  UPDATE conversations SET
    last_message    = preview,
    last_message_at = new.created_at,
    unread_a   = CASE WHEN conv.user_a_id != new.sender_id THEN unread_a + 1 ELSE unread_a END,
    unread_b   = CASE WHEN conv.user_b_id != new.sender_id THEN unread_b + 1 ELSE unread_b END,
    opened_at  = COALESCE(conv.opened_at,  new.created_at),
    expires_at = COALESCE(conv.expires_at, new.created_at + INTERVAL '10 minutes'),
    status     = CASE WHEN conv.status = 'free' THEN 'pending' ELSE conv.status END
  WHERE id = new.conversation_id;

  RETURN new;
END;
$$;

-- RPC: upsert an order-type conversation between buyer and seller, insert the
-- opening order-card message, and return both IDs so the client can track them.
--
-- Parameters:
--   p_seller_id  — seller's auth.users UUID (must exist in auth.users)
--   p_order_card — the full order card object as JSON
--
-- Returns: table(conv_id uuid, msg_id uuid)
CREATE OR REPLACE FUNCTION create_order_conversation(
  p_seller_id  uuid,
  p_order_card jsonb
)
RETURNS TABLE(conv_id uuid, msg_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conv_id uuid;
  v_msg_id  uuid;
BEGIN
  -- Get or create a conversation between the calling user and the seller
  SELECT id INTO v_conv_id
    FROM conversations
   WHERE (user_a_id = auth.uid() AND user_b_id = p_seller_id)
      OR (user_a_id = p_seller_id AND user_b_id = auth.uid())
   LIMIT 1;

  IF v_conv_id IS NULL THEN
    INSERT INTO conversations (user_a_id, user_b_id, status)
    VALUES (auth.uid(), p_seller_id, 'free')
    ON CONFLICT (
      least(user_a_id::text, user_b_id::text),
      greatest(user_a_id::text, user_b_id::text)
    ) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_conv_id;

    -- Fallback if conflict returned nothing
    IF v_conv_id IS NULL THEN
      SELECT id INTO v_conv_id
        FROM conversations
       WHERE (user_a_id = auth.uid() AND user_b_id = p_seller_id)
          OR (user_a_id = p_seller_id AND user_b_id = auth.uid())
       LIMIT 1;
    END IF;
  END IF;

  -- Insert the order card message
  INSERT INTO messages (conversation_id, sender_id, text, order_card)
  VALUES (v_conv_id, auth.uid(), NULL, p_order_card)
  RETURNING id INTO v_msg_id;

  RETURN QUERY SELECT v_conv_id, v_msg_id;
END;
$$;
