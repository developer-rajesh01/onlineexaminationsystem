import React from 'react';

function Footer() {
  return (
    <footer className="bg-[#174B85] text-white py-8 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">

        {/* About */}
        <div>
          <h3 className="text-lg font-semibold mb-2">online Examination System</h3>
          <p className="text-sm text-gray-400">
            "An online examination system is software that enables remote creation, delivery, and evaluation of exams through the internet, providing a convenient and efficient testing platform."
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/" className="hover:text-yellow-500">Home</a></li>
            <li><a href="/seats" className="hover:text-yellow-500">Login</a></li>
            <li><a href="/help" className="hover:text-yellow-500">Register</a></li>
            {/* <li><a href="/login" className="hover:text-white">Login</a></li> */}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Contact</h3>
          <p className="text-sm text-gray-400">📍 123 online Examinationt, City</p>
          <p className="text-sm text-gray-400">📧 support@onlineExaminationSystem.com</p>
          <p className="text-sm text-gray-400">📞 +91 9876543210</p>
        </div>
      </div>

      {/* Bottom Note */}
      <div className="text-center text-xs text-gray-500 mt-6 border-t border-gray-700 pt-4">
        © {new Date().getFullYear()} Smart Library. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
