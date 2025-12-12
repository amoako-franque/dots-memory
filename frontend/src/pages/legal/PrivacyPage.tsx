import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';

export default function PrivacyPage() {
    const currentYear = new Date().getFullYear();
    const lastUpdated = 'December 2024';

    return (
        <>
            {/* Header */}
            <div className="bg-[#8B2E3C] text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-white/80">Last updated: {lastUpdated}</p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-2 border-[#E8D4B8]">
                        <CardContent className="p-8 space-y-8">
                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">1. Introduction</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    Memory ("we", "our", or "us") is committed to protecting your privacy. This Privacy
                                    Policy explains how we collect, use, disclose, and safeguard your information when you
                                    use our Service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">2. Information We Collect</h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-[#8B7355] mb-2">Account Information</h3>
                                        <p className="text-[#6B5A42] leading-relaxed">
                                            When you create an account, we collect your email address, name, and password
                                            (which is encrypted). We may also collect optional profile information.
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-[#8B7355] mb-2">Content</h3>
                                        <p className="text-[#6B5A42] leading-relaxed">
                                            We store the photos, videos, and other content you upload to Memory. This
                                            content is stored securely and is only accessible to you and those you share
                                            your albums with.
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-[#8B7355] mb-2">Usage Data</h3>
                                        <p className="text-[#6B5A42] leading-relaxed">
                                            We collect information about how you use the Service, including access times,
                                            pages viewed, and features used. This helps us improve the Service.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">3. How We Use Your Information</h2>
                                <p className="text-[#6B5A42] leading-relaxed mb-4">We use the information we collect to:</p>
                                <ul className="list-disc list-inside space-y-2 text-[#6B5A42] ml-4">
                                    <li>Provide, maintain, and improve the Service</li>
                                    <li>Process transactions and send related information</li>
                                    <li>Send you technical notices and support messages</li>
                                    <li>Respond to your comments and questions</li>
                                    <li>Monitor and analyze usage patterns</li>
                                    <li>Detect, prevent, and address technical issues</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">4. Information Sharing</h2>
                                <p className="text-[#6B5A42] leading-relaxed mb-4">
                                    We do not sell your personal information. We may share your information only in the
                                    following circumstances:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-[#6B5A42] ml-4">
                                    <li>
                                        <strong>With your consent:</strong> We share information when you explicitly
                                        consent, such as when you share an album with others.
                                    </li>
                                    <li>
                                        <strong>Service providers:</strong> We may share information with third-party
                                        service providers who perform services on our behalf.
                                    </li>
                                    <li>
                                        <strong>Legal requirements:</strong> We may disclose information if required by
                                        law or in response to valid requests by public authorities.
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">5. Data Security</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    We implement appropriate technical and organizational security measures to protect your
                                    personal information. However, no method of transmission over the Internet or electronic
                                    storage is 100% secure, and we cannot guarantee absolute security.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">6. Your Rights</h2>
                                <p className="text-[#6B5A42] leading-relaxed mb-4">You have the right to:</p>
                                <ul className="list-disc list-inside space-y-2 text-[#6B5A42] ml-4">
                                    <li>Access and receive a copy of your personal data</li>
                                    <li>Rectify inaccurate or incomplete data</li>
                                    <li>Request deletion of your personal data</li>
                                    <li>Object to processing of your personal data</li>
                                    <li>Request restriction of processing</li>
                                    <li>Data portability</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">7. Cookies and Tracking</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    We use cookies and similar tracking technologies to track activity on our Service and
                                    hold certain information. You can instruct your browser to refuse all cookies or to
                                    indicate when a cookie is being sent.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">8. Children's Privacy</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    Our Service is not intended for children under 13 years of age. We do not knowingly
                                    collect personal information from children under 13.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">9. Changes to This Policy</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    We may update our Privacy Policy from time to time. We will notify you of any changes
                                    by posting the new Privacy Policy on this page and updating the "Last updated" date.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">10. Contact Us</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    If you have any questions about this Privacy Policy, please contact us at{' '}
                                    <Link to="/contact" className="text-[#8B2E3C] hover:underline">
                                        our contact page
                                    </Link>
                                    .
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#8B7355] text-white py-8 mt-16">
                <div className="container mx-auto px-4 text-center text-sm">
                    <p>&copy; {currentYear} Memory. All rights reserved.</p>
                    <div className="mt-4 space-x-4">
                        <Link to="/terms" className="hover:underline">Terms</Link>
                        <Link to="/privacy" className="hover:underline">Privacy</Link>
                        <Link to="/contact" className="hover:underline">Contact</Link>
                    </div>
                </div>
            </footer>
        </>
    );
}

