-- RPC: create (or return existing) conversation when a meet request is accepted.
-- Uses SECURITY DEFINER so it can insert into conversations without a client INSERT policy.
CREATE OR REPLACE FUNCTION create_meet_conversation(
  p_other_user_id uuid,
  p_session_id    uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  conv_id uuid;
BEGIN
  -- Return existing conversation if one already exists between these two users
  SELECT id INTO conv_id
    FROM conversations
   WHERE (user_a_id = auth.uid() AND user_b_id = p_other_user_id)
      OR (user_a_id = p_other_user_id AND user_b_id = auth.uid())
   LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversations (user_a_id, user_b_id, session_id, status)
    VALUES (auth.uid(), p_other_user_id, p_session_id, 'free')
    ON CONFLICT (
      least(user_a_id::text, user_b_id::text),
      greatest(user_a_id::text, user_b_id::text)
    ) DO UPDATE SET session_id = COALESCE(EXCLUDED.session_id, conversations.session_id)
    RETURNING id INTO conv_id;

    -- If insert hit the conflict and returned nothing, fetch it
    IF conv_id IS NULL THEN
      SELECT id INTO conv_id
        FROM conversations
       WHERE (user_a_id = auth.uid() AND user_b_id = p_other_user_id)
          OR (user_a_id = p_other_user_id AND user_b_id = auth.uid())
       LIMIT 1;
    END IF;
  END IF;

  RETURN conv_id;
END;
$$;
