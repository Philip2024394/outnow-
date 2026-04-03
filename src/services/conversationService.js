import { supabase } from '../lib/supabase';

const isDemo = (id) =>
  !supabase || !id || id.startsWith('demo-') || id.startsWith('conv-') || id.startsWith('meet-');

export async function sendMessage(conversationId, senderId, text) {
  if (isDemo(conversationId)) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      id: `m-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      text,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, text })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendImageMessage(conversationId, senderId, imageURL) {
  if (isDemo(conversationId)) {
    return {
      id: `m-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      text: null,
      image_url: imageURL,
      created_at: new Date().toISOString(),
    };
  }

  // In production would upload to storage first; for now insert the object URL directly
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, text: null, image_url: imageURL })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendContactMessage(conversationId, senderId, contactType, contactValue) {
  if (isDemo(conversationId)) {
    return {
      id: `m-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      text: null,
      contact_type: contactType,
      contact_value: contactValue,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      text: null,
      contact_type: contactType,
      contact_value: contactValue,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unlockConversation(conversationId) {
  if (isDemo(conversationId)) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return;
  }

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'unlocked', unlocked_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function likeMessage(messageId, liked) {
  if (isDemo(messageId)) return;

  await supabase
    .from('messages')
    .update({ liked })
    .eq('id', messageId);
}

export async function markConversationRead(conversationId, isUserA) {
  if (isDemo(conversationId)) return;

  await supabase
    .from('conversations')
    .update(isUserA ? { unread_a: 0 } : { unread_b: 0 })
    .eq('id', conversationId);
}
