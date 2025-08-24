import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, CheckSquare, Smartphone, ArrowLeft } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Attendly</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                Login
              </Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Register School
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Attendly
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to transform school management through innovative technology 
              that makes education more efficient, secure, and connected.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                Attendly was born from a simple observation: schools spend too much time on 
                administrative tasks and not enough time on what matters most - education.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that every school deserves access to modern, efficient tools that 
                streamline operations, enhance security, and improve communication between 
                administrators, teachers, parents, and students.
              </p>
              <p className="text-lg text-gray-600">
                Our platform is designed to be intuitive, secure, and scalable - whether you're 
                a small private school or a large educational institution.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What We Do</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckSquare className="w-6 h-6 text-indigo-600 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Attendance Management</h4>
                    <p className="text-gray-600 text-sm">Streamlined tracking with biometric, RFID, and manual options</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-indigo-600 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Security & Access Control</h4>
                    <p className="text-gray-600 text-sm">Digital gate passes and visitor management</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-6 h-6 text-indigo-600 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Student Records</h4>
                    <p className="text-gray-600 text-sm">Complete student profiles and academic tracking</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Smartphone className="w-6 h-6 text-indigo-600 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Mobile Access</h4>
                    <p className="text-gray-600 text-sm">Cross-platform mobile apps for all users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do at Attendly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Security First</h3>
              <p className="text-gray-600">
                We prioritize the security and privacy of student and school data above all else.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">User-Centered Design</h3>
              <p className="text-gray-600">
                Every feature is designed with the end user in mind - from administrators to parents.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reliability</h3>
              <p className="text-gray-600">
                Schools depend on our system daily, so we ensure 99.9% uptime and continuous support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of schools already using Attendly to streamline their operations 
            and improve student safety.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-200">
              Register Your School
            </Link>
            <Link to="/login" className="bg-transparent text-white px-8 py-4 rounded-lg text-lg font-semibold border-2 border-white hover:bg-white hover:text-indigo-600 transition-all duration-200">
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Have questions? We'd love to hear from you.
              </p>
              <div className="mt-4">
                <Link to="/contact" className="text-indigo-400 hover:text-white transition-colors">
                  Contact Us →
                </Link>
              </div>
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

export default AboutPage;
