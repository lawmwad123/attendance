import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  CheckSquare, 
  Smartphone, 
  BarChart3, 
  Clock,
  ArrowRight,
  Star,
  Check,
  Play,
  Mail,
  Phone,
  MapPin,
  Menu,
  X
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: CheckSquare,
      title: "Smart Attendance Tracking",
      description: "Biometric, RFID, and manual attendance tracking with real-time updates."
    },
    {
      icon: Shield,
      title: "Visitor & Security Management",
      description: "Digital gate passes, visitor tracking, and enhanced security."
    },
    {
      icon: Users,
      title: "Student Records & Classes",
      description: "Complete student profiles and class management in one place."
    },
    {
      icon: Smartphone,
      title: "Mobile Access",
      description: "React Native mobile app for parents, teachers, and security staff."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive analytics and detailed reports for decision-making."
    },
    {
      icon: Clock,
      title: "Real-time Notifications",
      description: "Instant alerts via SMS, email, and push notifications."
    }
  ];

  const pricingPlans = [
    {
      name: "Free Trial",
      price: "$0",
      duration: "14 days",
      features: ["Up to 50 students", "Basic attendance tracking", "Mobile app access", "Email support"],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Standard School",
      price: "$99",
      duration: "per month",
      features: ["Up to 500 students", "All attendance methods", "Gate pass management", "Advanced analytics", "Priority support"],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      duration: "per month",
      features: ["Unlimited students", "Multi-branch support", "Custom integrations", "Dedicated support"],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Attendly</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link to="/about" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                About
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                Contact
              </Link>
              <Link to="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                Login
              </Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Register School
              </Link>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-indigo-600 p-2">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <Link to="/login" className="text-gray-700 hover:text-indigo-600 block px-3 py-2 text-base font-medium">
                Login
              </Link>
              <Link to="/register" className="bg-indigo-600 text-white block px-3 py-2 rounded-lg text-base font-medium hover:bg-indigo-700">
                Register School
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Manage Your School
              <span className="text-indigo-600"> Smarter</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Attendance, classes, visitors, and everything in one place. 
              Streamline your school management with our comprehensive platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2">
                <span>Register Your School</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your School
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From attendance tracking to security management, our platform provides all the tools 
              you need to run your school efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-all duration-200">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your school's needs. All plans include our core features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-xl p-8 ${plan.popular ? 'ring-2 ring-indigo-600 shadow-xl' : 'shadow-lg'}`}>
                {plan.popular && (
                  <div className="bg-indigo-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of schools already using Attendly to streamline their operations 
            and improve student safety.
          </p>
          <Link to="/register" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 inline-flex items-center space-x-2">
            <span>Register Your School Today</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Attendly</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The comprehensive school attendance management system that helps schools 
                streamline operations, enhance security, and improve communication.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <a href="mailto:hello@attendly.com" className="hover:text-white transition-colors">
                    hello@attendly.com
                  </a>
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <a href="tel:+1234567890" className="hover:text-white transition-colors">
                    +1 (234) 567-890
                  </a>
                </li>
                <li className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>123 School Street, Education City, EC 12345</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 Attendly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
