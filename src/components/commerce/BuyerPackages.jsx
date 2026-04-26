/**
 * BuyerPackages — International buyer contact packages
 * Package 1: WhatsApp number only ($4.99)
 * Package 2: WhatsApp + Social Media ($9.99)
 * Payment via Stripe, auto-release on confirmation
 * Languages: Indonesian & English
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'

const PACKAGES = [
  {
    id: 'whatsapp_only',
    title: 'WhatsApp Contact',
    price: 4.99,
    currency: 'USD',
    icon: '💬',
    includes: ['Verified WhatsApp number', 'Direct message seller', 'Guaranteed active number'],
    refundable: true,
    refundNote: 'If number is not active: full refund or replacement seller match',
  },
  {
    id: 'whatsapp_social',
    title: 'WhatsApp + Social Media',
    price: 9.99,
    currency: 'USD',
    icon: '📱',
    includes: ['Verified WhatsApp number', 'Instagram account', 'TikTok account', 'Facebook page', 'Website (if available)'],
    refundable: false,
    refundNote: 'No refund once social media details are sent. Customer service available if contact issues arise.',
  },
]

export default function BuyerPackages({ seller, onClose, onPurchased }) {
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [purchased, setPurchased] = useState(null) // purchased contact info
  const [lang, setLang] = useState('en') // 'en' | 'id'

  const t = {
    en: {
      title: 'Contact Seller',
      subtitle: 'Choose a package to get seller contact details',
      selectPackage: 'Select Package',
      pay: 'Pay with Stripe',
      processing: 'Processing...',
      terms: 'Terms & Conditions',
      whatsappGuarantee: 'WhatsApp numbers are verified and guaranteed active. If not active, choose a full refund or replacement seller.',
      socialNoRefund: 'Once social media details are delivered, the order is final. INDOO Market offers customer service for any contact issues.',
      languageNote: 'Sellers speak Indonesian and English only.',
      contactDelivered: 'Contact Delivered',
      whatsapp: 'WhatsApp',
      refundPolicy: 'Refund Policy',
    },
    id: {
      title: 'Hubungi Penjual',
      subtitle: 'Pilih paket untuk mendapatkan kontak penjual',
      selectPackage: 'Pilih Paket',
      pay: 'Bayar dengan Stripe',
      processing: 'Memproses...',
      terms: 'Syarat & Ketentuan',
      whatsappGuarantee: 'Nomor WhatsApp sudah diverifikasi dan dijamin aktif. Jika tidak aktif, pilih pengembalian dana penuh atau pengganti penjual.',
      socialNoRefund: 'Setelah detail media sosial dikirim, pesanan bersifat final. INDOO Market menyediakan layanan pelanggan untuk masalah kontak.',
      languageNote: 'Penjual berbicara Bahasa Indonesia dan Bahasa Inggris saja.',
      contactDelivered: 'Kontak Terkirim',
      whatsapp: 'WhatsApp',
      refundPolicy: 'Kebijakan Pengembalian',
    },
  }
  const txt = t[lang]

  const handlePurchase = async (pkg) => {
    setProcessing(true)
    setSelectedPkg(pkg.id)

    if (supabase) {
      try {
        // Create Stripe checkout session via edge function
        const { data } = await supabase.functions.invoke('create-contact-checkout', {
          body: {
            seller_id: seller.id,
            package_type: pkg.id,
            amount: pkg.price * 100, // cents
            currency: 'usd',
          },
        })

        if (data?.url) {
          // Record pending purchase
          await supabase.from('contact_purchases').insert({
            buyer_id: (await supabase.auth.getUser()).data.user?.id,
            seller_id: seller.id,
            package_type: pkg.id,
            stripe_session_id: data.session_id,
            amount_usd: pkg.price,
            payment_status: 'pending',
          })

          // Redirect to Stripe
          window.location.href = data.url
          return
        }
      } catch {}
    }

    // Demo mode — simulate payment and deliver contact
    setTimeout(() => {
      const contact = {
        wa_number: seller.wa_number ?? seller.phone ?? '+6281234567890',
        ...(pkg.id === 'whatsapp_social' ? {
          instagram: seller.instagram_handle ?? null,
          tiktok: seller.tiktok_handle ?? null,
          facebook: seller.facebook_handle ?? null,
          website: seller.website_url ?? null,
        } : {}),
      }
      setPurchased(contact)
      setProcessing(false)
      onPurchased?.(contact)
    }, 2000)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10020, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>{txt.title}</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{seller.display_name ?? seller.brand_name ?? 'Seller'}</span>
        </div>
        {/* Language toggle */}
        <button onClick={() => setLang(l => l === 'en' ? 'id' : 'en')} style={{
          padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
        }}>{lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Purchased — show contact info */}
        {purchased ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 8 }}>✅</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', display: 'block' }}>{txt.contactDelivered}</span>
            </div>

            {/* WhatsApp */}
            <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#25D366', display: 'block', marginBottom: 6 }}>{txt.whatsapp}</span>
              <a href={`https://wa.me/${purchased.wa_number}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, fontWeight: 900, color: '#fff', textDecoration: 'none' }}>
                +{purchased.wa_number}
              </a>
            </div>

            {/* Social Media */}
            {purchased.instagram && (
              <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>📸</span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block' }}>Instagram</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{purchased.instagram}</span>
                </div>
              </div>
            )}
            {purchased.tiktok && (
              <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🎵</span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block' }}>TikTok</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{purchased.tiktok}</span>
                </div>
              </div>
            )}
            {purchased.facebook && (
              <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>👤</span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block' }}>Facebook</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{purchased.facebook}</span>
                </div>
              </div>
            )}
            {purchased.website && (
              <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🌐</span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block' }}>Website</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{purchased.website}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 16, textAlign: 'center' }}>{txt.subtitle}</span>

            {/* Package cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PACKAGES.map(pkg => (
                <div key={pkg.id} style={{
                  padding: '20px', borderRadius: 18,
                  background: selectedPkg === pkg.id ? 'rgba(141,198,63,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${selectedPkg === pkg.id ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 32 }}>{pkg.icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>{pkg.title}</span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{pkg.refundable ? '✓ Refundable' : 'Final sale'}</span>
                    </div>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F' }}>${pkg.price}</span>
                  </div>

                  {/* Includes list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {pkg.includes.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: '#8DC63F' }}>✓</span>
                        <span style={{ fontSize: 14, color: '#fff' }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Refund note */}
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: pkg.refundable ? 'rgba(141,198,63,0.06)' : 'rgba(255,255,255,0.03)', marginBottom: 14 }}>
                    <span style={{ fontSize: 14, color: pkg.refundable ? '#8DC63F' : 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{pkg.refundNote}</span>
                  </div>

                  {/* Buy button */}
                  <button onClick={() => handlePurchase(pkg)} disabled={processing} style={{
                    width: '100%', padding: '14px', borderRadius: 14,
                    background: '#8DC63F', border: 'none', color: '#000',
                    fontSize: 16, fontWeight: 900, cursor: 'pointer',
                    opacity: processing && selectedPkg === pkg.id ? 0.6 : 1,
                    boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
                  }}>
                    {processing && selectedPkg === pkg.id ? txt.processing : `${txt.pay} — $${pkg.price}`}
                  </button>
                </div>
              ))}
            </div>

            {/* Terms */}
            <div style={{ marginTop: 20, padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 10 }}>{txt.terms}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>• {txt.whatsappGuarantee}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>• {txt.socialNoRefund}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>• {txt.languageNote}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
