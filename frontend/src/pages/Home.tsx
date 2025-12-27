import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { RefreshCw, Users, Shield, Zap, ArrowRight } from 'lucide-react'

const Home: React.FC = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: <RefreshCw className="h-8 w-8 text-primary-600 dark:text-primary-400" />,
      title: 'Easy Room Swapping',
      description: 'Request and manage room swaps with other students seamlessly.'
    },
    {
      icon: <Users className="h-8 w-8 text-primary-600 dark:text-primary-400" />,
      title: 'Student Community',
      description: 'Connect with fellow students and find the perfect room match.'
    },
    {
      icon: <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />,
      title: 'Secure Platform',
      description: 'Your data is protected with industry-standard security measures.'
    },
    {
      icon: <Zap className="h-8 w-8 text-primary-600 dark:text-primary-400" />,
      title: 'Instant Notifications',
      description: 'Get notified immediately when someone responds to your swap request.'
    }
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <RefreshCw className="h-16 w-16 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Hostel Room
            <span className="text-primary-600 dark:text-primary-400"> Swapping</span>
            <br />Made Simple
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with fellow students, find your ideal room, and make the swap process effortless. 
            Join our community of students who've already found their perfect hostel match.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link 
                to="/dashboard" 
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-primary-600 dark:hover:border-primary-400 transition-all duration-200 hover:scale-105"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose HostelSwap?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We've built the most intuitive platform for hostel room swapping, 
              designed specifically for students by students.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="card p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-full">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Find Your Perfect Room?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have successfully swapped their hostel rooms. 
              It's free, secure, and takes less than 2 minutes to get started.
            </p>
            <Link 
              to="/register" 
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home