import { db } from '@/firebase/config'
import {
  collection, addDoc, getDocs, doc, updateDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'

const COL = 'suggestedVenues'

export async function submitVenueSuggestion({ name, area, activityTypes, link, openTime, closeTime, offersDiscount, discountPercent, discountType, userId, displayName }) {
  return addDoc(collection(db, COL), {
    name,
    area,
    activityTypes:   activityTypes   ?? [],
    link:            link            ?? '',
    openTime:        openTime        ?? '',
    closeTime:       closeTime       ?? '',
    offersDiscount:  offersDiscount  ?? false,
    discountPercent: discountPercent ?? null,
    discountType:    discountType    ?? null,
    discountStatus:  offersDiscount ? 'offered' : null, // 'offered' | 'confirmed' | 'declined'
    submittedBy:     userId,
    submittedByName: displayName,
    submittedAt: serverTimestamp(),
    status: 'pending',
    adminNote: '',
  })
}

export async function confirmVenueDiscount(id) {
  return updateDoc(doc(db, COL, id), { discountStatus: 'confirmed' })
}

export async function declineVenueDiscount(id) {
  return updateDoc(doc(db, COL, id), { discountStatus: 'declined' })
}

export async function getSuggestedVenues() {
  const snap = await getDocs(query(collection(db, COL), orderBy('submittedAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function approveVenueSuggestion(id) {
  return updateDoc(doc(db, COL, id), { status: 'approved' })
}

export async function rejectVenueSuggestion(id, note = '') {
  return updateDoc(doc(db, COL, id), { status: 'rejected', adminNote: note })
}
