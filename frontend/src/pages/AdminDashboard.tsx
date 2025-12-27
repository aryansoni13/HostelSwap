import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Shield, Building, Plus, Minus, Hash, Bed, Users, BarChart3 } from 'lucide-react'
import { Hostel } from '../types'
import toast from 'react-hot-toast'

const AdminDashboard: React.FC = () => {
  const [roomAction, setRoomAction] = useState({
    hostel: '',
    count: 1,
    bedType: '4 bedded'
  })
  const [hostels, setHostels] = useState<Hostel[]>([])
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  const hostelOptions = [
    'block1', 'block2', 'block3', 'block4',
    'block5', 'block6', 'block7', 'block8'
  ]

  const bedTypeOptions = [
    '4 bedded', '3 bedded', '2 bedded', '1 bedded'
  ]

  useEffect(() => {
    fetchHostelStats()
  }, [])

  const fetchHostelStats = async () => {
    try {
      // This would be an API call to get hostel statistics
      // For now, we'll simulate the data
      setStatsLoading(false)
    } catch (error) {
      console.error('Failed to fetch hostel stats:', error)
      setStatsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setRoomAction({
      ...roomAction,
      [name]: name === 'count' ? parseInt(value) || 1 : value
    })
  }

  const handleIncreaseRooms = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/api/admin/increase-rooms', roomAction)
      toast.success(`Successfully added ${roomAction.count} room(s) to ${roomAction.hostel}`)
      setRoomAction({ hostel: '', count: 1, bedType: '4 bedded' })
      fetchHostelStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to increase rooms')
    } finally {
      setLoading(false)
    }
  }

  const handleDecreaseRooms = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/api/admin/decrease-rooms', {
        hostel: roomAction.hostel,
        count: roomAction.count,
        bedType: roomAction.bedType
      })
      toast.success(`Successfully removed ${roomAction.count} ${roomAction.bedType} room(s) from ${roomAction.hostel}`)
      setRoomAction({ hostel: '', count: 1, bedType: '4 bedded' })
      fetchHostelStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to decrease rooms')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mr-4">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage hostel rooms and system settings
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-4">
              <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">8</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hostels</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mr-4">
              <Hash className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">-</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Rooms</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-4">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">-</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Students</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full mr-4">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">-</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Swaps</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Increase Rooms */}
        <div className="card p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
              <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Add Rooms
            </h2>
          </div>

          <form onSubmit={handleIncreaseRooms} className="space-y-4">
            <div>
              <label htmlFor="hostel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Hostel Block
              </label>
              <select
                id="hostel"
                name="hostel"
                value={roomAction.hostel}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select Hostel Block</option>
                {hostelOptions.map((hostel) => (
                  <option key={hostel} value={hostel}>
                    {hostel.charAt(0).toUpperCase() + hostel.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bedType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Bed className="inline h-4 w-4 mr-1" />
                Bed Type
              </label>
              <select
                id="bedType"
                name="bedType"
                value={roomAction.bedType}
                onChange={handleChange}
                required
                className="input-field"
              >
                {bedTypeOptions.map((bedType) => (
                  <option key={bedType} value={bedType}>
                    {bedType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                Number of Rooms
              </label>
              <input
                type="number"
                id="count"
                name="count"
                value={roomAction.count}
                onChange={handleChange}
                min="1"
                required
                className="input-field"
                placeholder="Enter number of rooms"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Add Rooms
                </>
              )}
            </button>
          </form>
        </div>

        {/* Decrease Rooms */}
        <div className="card p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
              <Minus className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Remove Rooms
            </h2>
          </div>

          <form onSubmit={handleDecreaseRooms} className="space-y-4">
            <div>
              <label htmlFor="hostel2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Hostel Block
              </label>
              <select
                id="hostel2"
                name="hostel"
                value={roomAction.hostel}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select Hostel Block</option>
                {hostelOptions.map((hostel) => (
                  <option key={hostel} value={hostel}>
                    {hostel.charAt(0).toUpperCase() + hostel.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bedType2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Bed className="inline h-4 w-4 mr-1" />
                Bed Type
              </label>
              <select
                id="bedType2"
                name="bedType"
                value={roomAction.bedType}
                onChange={handleChange}
                required
                className="input-field"
              >
                {bedTypeOptions.map((bedType) => (
                  <option key={bedType} value={bedType}>
                    {bedType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="count2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                Number of Rooms
              </label>
              <input
                type="number"
                id="count2"
                name="count"
                value={roomAction.count}
                onChange={handleChange}
                min="1"
                required
                className="input-field"
                placeholder="Enter number of rooms"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Minus className="h-5 w-5 mr-2" />
                  Remove Rooms
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Hostel Management */}
      <div className="mt-8 card p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Hostel Overview
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {hostelOptions.map((hostel) => (
            <div key={hostel} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {hostel.charAt(0).toUpperCase() + hostel.slice(1)}
                </h3>
                <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Total Rooms: -</p>
                <p>Occupied: -</p>
                <p>Available: -</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard