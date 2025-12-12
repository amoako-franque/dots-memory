import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';

export default function TermsPage() {
    const currentYear = new Date().getFullYear();
    const lastUpdated = 'December 2024';

    return (
        <>
            {/* Header */}
            <div className="bg-[#8B2E3C] text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
                    <p className="text-white/80">Last updated: {lastUpdated}</p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-2 border-[#E8D4B8]">
                        <CardContent className="p-8 space-y-8">
                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">1. Acceptance of Terms</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    By accessing and using Memory ("the Service"), you accept and agree to be bound by the
                                    terms and provision of this agreement. If you do not agree to these Terms, please do not
                                    use the Service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">2. Use License</h2>
                                <p className="text-[#6B5A42] leading-relaxed mb-4">
                                    Permission is granted to temporarily use Memory for personal, non-commercial transitory
                                    viewing only. This is the grant of a license, not a transfer of title, and under this
                                    license you may not:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-[#6B5A42] ml-4">
                                    <li>Modify or copy the materials</li>
                                    <li>Use the materials for any commercial purpose or for any public display</li>
                                    <li>Attempt to reverse engineer any software contained in Memory</li>
                                    <li>Remove any copyright or other proprietary notations from the materials</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">3. User Accounts</h2>
                                <p className="text-[#6B5A42] leading-relaxed mb-4">
                                    When you create an account with us, you must provide information that is accurate,
                                    complete, and current at all times. You are responsible for safeguarding the password
                                    and for all activities that occur under your account.
                                </p>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    You agree not to disclose your password to any third party and to take sole
                                    responsibility for any activities or actions under your account.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">4. Content</h2>
                                <p className="text-[#6B5A42] leading-relaxed mb-4">
                                    You retain ownership of any content you upload to Memory. By uploading content, you
                                    grant us a worldwide, non-exclusive, royalty-free license to use, store, and display
                                    your content solely for the purpose of providing the Service.
                                </p>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    You are responsible for ensuring that any content you upload does not violate any laws
                                    or infringe on the rights of others, including intellectual property rights.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">5. Prohibited Uses</h2>
                                <p className="text-[#6B5A42] leading-relaxed mb-4">You may not use Memory:</p>
                                <ul className="list-disc list-inside space-y-2 text-[#6B5A42] ml-4">
                                    <li>In any way that violates any applicable law or regulation</li>
                                    <li>To transmit any malicious code or viruses</li>
                                    <li>To collect or store personal data about other users</li>
                                    <li>To spam, harass, or harm other users</li>
                                    <li>To impersonate any person or entity</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">6. Subscription and Payment</h2>
                                <p className="text-[#6B5A42] leading-relaxed mb-4">
                                    Memory offers various subscription plans. By subscribing, you agree to pay the fees
                                    associated with your chosen plan. Subscriptions automatically renew unless cancelled.
                                </p>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    You may cancel your subscription at any time. Refunds are provided according to our
                                    refund policy, which may vary by plan and circumstances.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">7. Limitation of Liability</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    In no event shall Memory, its directors, employees, or agents be liable for any indirect,
                                    incidental, special, consequential, or punitive damages, including without limitation,
                                    loss of profits, data, use, goodwill, or other intangible losses, resulting from your
                                    use of the Service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">8. Changes to Terms</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    We reserve the right to modify or replace these Terms at any time. If a revision is
                                    material, we will provide at least 30 days notice prior to any new terms taking effect.
                                    What constitutes a material change will be determined at our sole discretion.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-[#8B7355] mb-4">9. Contact Information</h2>
                                <p className="text-[#6B5A42] leading-relaxed">
                                    If you have any questions about these Terms, please contact us at{' '}
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

