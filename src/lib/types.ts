// Type definitions shared across the app

export type PointType = 'fruit' | 'flower' | 'herb' | 'ornamental'

export interface CollectionPointDTO {
  id: string
  name: string
  description: string | null
  type: PointType
  hasFruit: boolean
  imageUrl: string | null
  latitude: number
  longitude: number
  address: string | null
  notes: string | null
  recordedAt: string
  createdAt: string
  updatedAt: string
  ownerId: string
  ownerName: string
  ownerAvatar: string | null
  sharedWithMe?: boolean
}

export interface FriendDTO {
  id: string
  name: string
  email: string
  avatar: string | null
  bio: string | null
  friendshipId: string
  status: 'pending' | 'accepted' | 'declined'
  direction: 'incoming' | 'outgoing'
  pointsCount?: number
}

export interface UserDTO {
  id: string
  email: string
  name: string
  avatar: string | null
  bio: string | null
}

// Point type metadata with consistent colors
// Colors chosen to be distinguishable for color-blind users (paired with emoji)
export const POINT_TYPE_META: Record<
  PointType,
  { label: string; emoji: string; color: string; description: string }
> = {
  fruit: {
    label: 'Fruta',
    emoji: '🍎',
    color: '#dc2626', // red-600
    description: 'Árvores e plantas frutíferas',
  },
  flower: {
    label: 'Flor',
    emoji: '🌸',
    color: '#db2777', // pink-600
    description: 'Flores e plantas ornamentais',
  },
  herb: {
    label: 'Erva',
    emoji: '🌿',
    color: '#16a34a', // green-600
    description: 'Ervas, temperos e plantas aromáticas',
  },
  ornamental: {
    label: 'Ornamental',
    emoji: '🪴',
    color: '#8b5cf6', // violet-500
    description: 'Plantas para decoração ou com aromas',
  },
}
