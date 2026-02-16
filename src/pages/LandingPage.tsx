import { Link, useNavigate } from 'react-router-dom';
import { Shield, BarChart3, Users, Lock, CheckCircle, ArrowRight, Activity, FileText, Download } from 'lucide-react';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <div className="bg-primary-50 p-2 rounded-lg">
                                    <Shield className="h-6 w-6 text-primary-600" />
                                </div>
                                <span className="font-bold text-xl text-gray-900">SmartVerify</span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">Features</a>
                            <a href="#security" className="text-gray-600 hover:text-primary-600 transition-colors">Security</a>
                            <a href="#testimonials" className="text-gray-600 hover:text-primary-600 transition-colors">Testimonials</a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                                Sign In
                            </Link>
                            <button
                                onClick={() => navigate('/verification')}
                                className="bg-primary-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-white pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-8 animate-fade-in-up">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            New: Advanced Biometric Verification
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-8 leading-tight">
                            Secure Identity Verification <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                                Made Simple
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Streamline your administrative workflow with our intelligent dashboard. manage users, track enrollments, and verify identities with enterprise-grade security.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/verification')}
                                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-full font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 flex items-center justify-center gap-2"
                            >
                                Get Started
                                <ArrowRight className="h-5 w-5" />
                            </button>
                            {/* <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                View Demo
                            </button> */}
                            <a
                                href="/i-am-alive.apk"
                                download
                                className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="h-5 w-5" />
                                Download I-Am-Alive App
                            </a>
                        </div>

                        <div className="mt-16 flex items-center justify-center gap-8 text-gray-400 grayscale opacity-70">
                            {/* Placeholders for logos if needed */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to manage</h2>
                        <p className="text-lg text-gray-600">Comprehensive tools for modern administration</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Users className="h-8 w-8 text-blue-500" />}
                            title="User Management"
                            description="Effortlessly manage staff and user profiles with granular permission controls and role-based access."
                            color="bg-blue-50"
                        />
                        <FeatureCard
                            icon={<Activity className="h-8 w-8 text-green-500" />}
                            title="Liveness Detection"
                            description="Advanced AI-powered biometric verification to ensure user presence and prevent fraud."
                            color="bg-green-50"
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8 text-purple-500" />}
                            title="Real-time Analytics"
                            description="Gain actionable insights with clear, interactive charts and comprehensive reporting tools."
                            color="bg-purple-50"
                        />
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-orange-500" />}
                            title="Audit Logging"
                            description="Complete trail of all system activities for security compliance and troubleshooting."
                            color="bg-orange-50"
                        />
                        <FeatureCard
                            icon={<FileText className="h-8 w-8 text-red-500" />}
                            title="Enrollment Tracking"
                            description="Monitor and manage user enrollment flows with detailed status tracking."
                            color="bg-red-50"
                        />
                        <FeatureCard
                            icon={<Lock className="h-8 w-8 text-indigo-500" />}
                            title="Enterprise Security"
                            description="Bank-grade encryption and security protocols to keep your data safe."
                            color="bg-indigo-50"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1558234674-cacc55b1a030?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to transform your workflow?</h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Join thousands of organizations using SmartVerify to secure and streamline their operations.
                    </p>
                    <button
                        onClick={() => navigate('/verification')}
                        className="px-10 py-4 bg-primary-500 text-white rounded-full font-bold text-lg hover:bg-primary-600 transition-all shadow-lg hover:scale-105"
                    >
                        Get Started Now
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-primary-100 p-2 rounded-lg">
                                    <Shield className="h-5 w-5 text-primary-600" />
                                </div>
                                <span className="font-bold text-lg text-gray-900">SmartVerify</span>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Secure, intelligent, and efficient administration for modern enterprises.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-primary-600">Features</a></li>
                                <li><a href="#" className="hover:text-primary-600">Security</a></li>
                                <li><a href="#" className="hover:text-primary-600">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-primary-600">About</a></li>
                                <li><a href="#" className="hover:text-primary-600">Careers</a></li>
                                <li><a href="#" className="hover:text-primary-600">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-primary-600">Privacy</a></li>
                                <li><a href="#" className="hover:text-primary-600">Terms</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
                        <p>&copy; 2025 SmartVerify Inc. All rights reserved.</p>
                        <div className="flex space-x-6 mt-4 sm:mt-0">
                            {/* Social icons could go here */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg transition-all group">
            <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    );
}
