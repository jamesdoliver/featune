export type VocalistType = 'male' | 'female'
export type LicenseType = 'unlimited' | 'limited' | 'exclusive'
export type OrderLicenseType = 'non_exclusive' | 'exclusive'
export type TrackStatus = 'pending' | 'approved' | 'rejected' | 'sold_out' | 'removed'
export type CreatorStatus = 'pending' | 'approved' | 'rejected'
export type OrderStatus = 'pending' | 'completed' | 'failed'
export type PayoutStatus = 'pending' | 'processing' | 'completed'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  is_creator: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Creator {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  profile_image_url: string | null
  revenue_split: number
  payout_details: Record<string, unknown> | null
  status: CreatorStatus
  created_at: string
  updated_at: string
}

export interface Track {
  id: string
  creator_id: string
  title: string
  vocalist_type: VocalistType | null
  genre: string | null
  mood: string | null
  bpm: number | null
  key: string | null
  length_seconds: number | null
  license_type: LicenseType
  license_limit: number | null
  licenses_sold: number
  price_non_exclusive: number | null
  price_exclusive: number | null
  lyrics: string | null
  lyrics_pdf_url: string | null
  artwork_url: string | null
  listening_file_url: string | null
  preview_clip_url: string | null
  preview_clip_start: number | null
  full_preview_url: string | null
  acapella_url: string | null
  instrumental_url: string | null
  waveform_data: number[] | null
  is_ai_generated: boolean
  status: TrackStatus
  created_at: string
  approved_at: string | null
  updated_at: string
}

export interface Order {
  id: string
  user_id: string | null
  stripe_payment_intent: string | null
  subtotal: number
  discount_percent: number
  discount_amount: number
  total: number
  status: OrderStatus
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  track_id: string | null
  license_type: OrderLicenseType
  price_at_purchase: number
  creator_earnings: number
  license_pdf_url: string | null
  created_at: string
}

export interface Payout {
  id: string
  creator_id: string
  amount: number
  status: PayoutStatus
  invoice_url: string | null
  created_at: string
  paid_at: string | null
}
