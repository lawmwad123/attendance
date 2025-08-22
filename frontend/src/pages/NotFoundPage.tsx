import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="space-y-8">
          <div>
            <h1 className="text-9xl font-bold text-secondary-300">404</h1>
            <h2 className="mt-4 text-3xl font-bold text-secondary-900">
              Page not found
            </h2>
            <p className="mt-2 text-secondary-600">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </div>
          
          <div>
            <Link
              to="/dashboard"
              className="btn-primary inline-flex items-center px-6 py-3"
            >
              Go back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 