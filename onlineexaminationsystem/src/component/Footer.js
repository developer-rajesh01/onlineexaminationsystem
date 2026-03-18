import React from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineLocationMarker,
    HiOutlineBuildingOffice2,
    HiOutlineAcademicCap,
    HiOutlineShieldCheck,
    HiOutlineClock,
} from 'react-icons/hi';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-br from-slate-900 via-indigo-900/80 to-slate-900/95 text-white relative overflow-hidden w-full">
            {/* Animated background elements - Fixed for mobile */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-48 h-48 lg:w-80 lg:h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 lg:w-80 lg:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Main content - Mobile Responsive */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                {/* Top section - Better mobile spacing */}
                <div className="pt-12 pb-12 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 xl:gap-12">

                        {/* Brand & Highlights - Full width on mobile */}
                        <div className="space-y-6 xl:col-span-2 lg:col-span-1 order-1">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 ring-2 ring-white/20 flex-shrink-0">
                                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight">EP</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent tracking-tight leading-tight">
                                        ExamPortal
                                    </h2>
                                    <p className="text-indigo-200 text-xs sm:text-sm font-medium mt-1">Professional Assessment Platform</p>
                                </div>
                            </div>

                            <p className="text-slate-300 leading-relaxed text-sm sm:text-base max-w-md">
                                Secure, scalable platform for online examinations with AI-powered evaluation,
                                real-time analytics, and enterprise-grade security.
                            </p>

                            {/* Key Features - Responsive grid */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
                                <div className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 min-h-[44px]">
                                    <HiOutlineShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium text-slate-300">Secure Proctored</span>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 min-h-[44px]">
                                    <HiOutlineAcademicCap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium text-slate-300">Auto-Grading</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links - Better mobile spacing */}
                        <div className="order-3 lg:order-2">
                            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span>Quick Links</span>
                            </h4>
                            <ul className="space-y-2 sm:space-y-3">
                                {[
                                    { label: 'Dashboard', to: '/' },
                                    { label: 'Features', to: '/features' },
                                    { label: 'Pricing', to: '/pricing' },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            to={item.to}
                                            className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 
                                            hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20 
                                            hover:shadow-lg hover:shadow-indigo-500/20 hover:translate-x-2 transition-all duration-200 w-full block"
                                        >
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                                            <span className="text-slate-300 font-medium group-hover:text-white text-sm">{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company - Better mobile spacing */}
                        <div className="order-2 lg:order-3">
                            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span>Company</span>
                            </h4>
                            <ul className="space-y-2 sm:space-y-3">
                                {[
                                    { label: 'About Us', to: '/about' },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            to={item.to}
                                            className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 
                                            hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20 
                                            hover:shadow-lg hover:shadow-indigo-500/20 hover:translate-x-2 transition-all duration-200 w-full block"
                                        >
                                            <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                                            <span className="text-slate-300 font-medium group-hover:text-white text-sm">{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Contact Section - Fully Responsive */}
                    <div className="mt-12 sm:mt-16 pt-12 sm:pt-16 border-t border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pb-12">
                            {/* Contact Info - Full width mobile */}
                            <div className="md:col-span-2">
                                <h5 className="text-xl font-bold text-white mb-6">Get In Touch</h5>
                                <div className="space-y-4">
                                    <a href="mailto:support@examportal.in" className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200">
                                        <HiOutlineMail className="w-6 h-6 text-indigo-400 mt-0.5 flex-shrink-0 group-hover:text-white" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-300 group-hover:text-white">support@examportal.in</p>
                                            <p className="text-xs text-slate-400">24/7 Technical Support</p>
                                        </div>
                                    </a>
                                    <a href="tel:+919876543210" className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200">
                                        <HiOutlinePhone className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0 group-hover:text-white" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-200 group-hover:text-white">+91 98765 43210</p>
                                            <p className="text-xs text-slate-400">Mon-Sat 9AM-7PM IST</p>
                                        </div>
                                    </a>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                        <HiOutlineLocationMarker className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-300">Jaipur, Rajasthan</p>
                                            <p className="text-xs text-slate-400">India - 302001</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar - Perfect Mobile Layout */}
                    <div className="pt-8 pb-8 sm:pt-12 sm:pb-8 border-t border-white/10">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 text-center lg:text-left">
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                                <div className="flex -space-x-2 order-2 sm:order-1">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full ring-2 ring-white/30 shadow-lg" />
                                    ))}
                                </div>
                                <div className="order-1 sm:order-none">
                                    <p className="text-slate-400 text-xs sm:text-sm">Trusted by 500+ Institutions</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-end w-full lg:w-auto">
                                <Link to="/privacy" className="text-xs sm:text-sm text-slate-400 hover:text-white font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10">Privacy</Link>
                                <Link to="/terms" className="text-xs sm:text-sm text-slate-400 hover:text-white font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10">Terms</Link>
                                <Link to="/security" className="text-xs sm:text-sm text-slate-400 hover:text-white font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10">Security</Link>
                            </div>
                        </div>

                        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10 text-center">
                            <p className="text-xs text-slate-500">
                                © {currentYear} ExamPortal. All rights reserved. Made with ❤️ in Jaipur, India
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
