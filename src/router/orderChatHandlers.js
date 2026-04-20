/**
 * Extracted from AppShell.jsx — conversation builders for order, offer, and connect flows.
 */

export function buildChatConversation({ userId, displayName, photoURL, age, area, emoji, lastMessage, messages }) {
  return {
    id:              `${emoji === '💕' ? 'dating' : 'chat'}-${userId}`,
    userId,
    displayName:     displayName ?? 'New Match',
    photoURL:        photoURL ?? null,
    age:             age ?? null,
    area:            area ?? null,
    emoji:           emoji ?? '💬',
    online:          true,
    status:          'free',
    openedAt:        Date.now(),
    lastMessage:     lastMessage ?? null,
    lastMessageTime: Date.now(),
    unread:          0,
    messages:        messages ?? [],
  }
}

export function buildIntroText(userProfile, user) {
  const myName    = userProfile?.displayName ?? user?.displayName ?? 'Someone'
  const myAge     = userProfile?.age ?? null
  const myCountry = userProfile?.country ?? null
  const myFor     = userProfile?.lookingFor ?? null
  const lookingForLabel = myFor
    ? myFor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null
  const introParts = [
    `Hi! I'm ${myName}`,
    myAge     ? `${myAge} years old` : null,
    myCountry ? `from ${myCountry}`  : null,
    lookingForLabel ? `looking for ${lookingForLabel}` : null,
  ].filter(Boolean)
  return introParts.join(', ') + ' 👋'
}

export function buildOrderConversation({ product, restaurant, variantStr, qty, items, subtotal, deliveryFee, total, notes, ref, sellerName, sellerId, seller, userId }) {
  const isRestaurant = !!restaurant
  const targetId     = isRestaurant ? (restaurant.id ?? restaurant.user_id) : (sellerId ?? seller?.id)
  const targetName   = isRestaurant ? restaurant.name : (sellerName ?? seller?.brandName ?? seller?.displayName ?? 'Seller')
  const targetPhoto  = isRestaurant ? (restaurant.photo ?? restaurant.image ?? null) : (seller?.photoURL ?? null)
  const convId       = `order-${isRestaurant ? 'restaurant' : 'marketplace'}-${targetId}`
  const orderRef     = ref ?? `#${isRestaurant ? 'MAKAN' : 'SHOP'}_${Date.now().toString().slice(-8)}`

  const orderItems = items ?? (product ? [{
    name:    product.name,
    qty:     qty ?? 1,
    price:   product.price ?? 0,
    variant: variantStr ?? null,
  }] : [])

  const orderSubtotal = subtotal ?? orderItems.reduce((s, i) => s + (i.price * i.qty), 0)
  const orderTotal    = total    ?? orderSubtotal + (deliveryFee ?? 0)

  const orderCard = {
    type:        isRestaurant ? 'restaurant' : 'marketplace',
    ref:         orderRef,
    sellerName:  targetName,
    sellerId:    targetId,
    items:       orderItems,
    subtotal:    orderSubtotal,
    deliveryFee: deliveryFee ?? null,
    total:       orderTotal,
    notes:       notes ?? '',
    status:      'pending',
    updatedAt:   Date.now(),
    safeTrade:       product?.safeTrade ?? null,
    cashOnDelivery:  product?.cashOnDelivery ?? false,
  }

  const openingMsg = {
    id:        `order-${Date.now()}`,
    senderId:  userId ?? 'me',
    fromMe:    true,
    orderCard,
    time:      Date.now(),
  }

  return {
    id:              convId,
    userId:          targetId,
    displayName:     targetName,
    photoURL:        targetPhoto,
    emoji:           isRestaurant ? '🍽️' : '🛍️',
    online:          true,
    status:          'free',
    openedAt:        Date.now(),
    lastMessage:     `${isRestaurant ? '🍽️' : '🛍️'} Order ${orderRef}`,
    lastMessageTime: Date.now(),
    unread:          0,
    messages:        [openingMsg],
  }
}

export function buildOfferConversation({ product, qty, offerPrice, listedPrice, totalOffer, message, sellerName, sellerId, userId }) {
  const targetId   = sellerId
  const targetName = sellerName ?? 'Seller'
  const convId     = `offer-marketplace-${targetId}-${Date.now()}`
  const offerRef   = `#OFFER_${Date.now().toString().slice(-8)}`

  const offerCard = {
    ref:          offerRef,
    productName:  product?.name ?? 'Product',
    productImage: product?.image ?? null,
    qty,
    offerPrice,
    listedPrice,
    totalOffer,
    message:      message ?? '',
    status:       'pending',
    updatedAt:    Date.now(),
  }

  const openingMsg = {
    id:       `offer-${Date.now()}`,
    senderId: userId ?? 'me',
    fromMe:   true,
    offerCard,
    time:     Date.now(),
  }

  return {
    id:              convId,
    userId:          targetId,
    displayName:     targetName,
    emoji:           '💰',
    online:          true,
    status:          'free',
    openedAt:        Date.now(),
    lastMessage:     `💰 Offer ${offerRef}`,
    lastMessageTime: Date.now(),
    unread:          0,
    messages:        [openingMsg],
  }
}
