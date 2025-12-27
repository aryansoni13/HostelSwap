export interface User {
  id: string
  name: string
  email: string
  hostelName: string
  roomNumber: string | number
  bedType?: string
  isAdmin?: boolean
}

export interface SwapRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterEmail: string
  requesterHostel: string
  requesterRoom: string | number
  requesterBedType: string
  targetStudentId: string
  targetName: string
  targetEmail: string
  targetHostel: string
  targetRoom: string | number
  targetBedType: string
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  type: 'sent' | 'received'
}

export interface Room {
  roomNumber: number
  bedType: string
  availableBeds: number
  occupiedBeds?: number
}

export interface Hostel {
  id: string
  name: string
  totalRooms: number
  rooms: Room[]
}

export interface Student {
  id: string
  name: string
  email: string
  hostel: string
  bedType: string
  roomNumber: number
  isVerified: boolean
}