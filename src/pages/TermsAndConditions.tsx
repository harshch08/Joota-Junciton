import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Terms and Conditions</CardTitle>
            <p className="text-sm text-gray-500 text-center">Effective Date: June 16, 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700">
              Welcome to JOOTA JUNCTION. By accessing or using our website and services, you agree to be bound by the following Terms of Service. These terms govern your use of our website, purchases, and interactions with our content. If you do not agree with these terms, please refrain from using our services.
            </p>

            <section>
              <h3 className="text-lg font-semibold mb-2">Use of the Website</h3>
              <p className="text-gray-700">
                This website and its content are provided for your personal and non-commercial use. You may browse and make purchases in accordance with these Terms. You agree not to misuse the site, including attempting unauthorized access, introducing viruses, or infringing on intellectual property rights. Any misuse may result in restricted access and potential legal action.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Eligibility and Accountability</h3>
              <p className="text-gray-700">
                To use our services, you must be at least 18 years old or using the website under the supervision of a parent or guardian. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Product Information and Availability</h3>
              <p className="text-gray-700">
                We strive to ensure that all product information, pricing, and images are accurate and up-to-date. However, occasional errors may occur. We reserve the right to modify or discontinue products at any time without notice. All orders are subject to availability and confirmation of payment.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Pricing and Payment</h3>
              <p className="text-gray-700">
                All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. Prices may change without prior notice. Payments are processed through secure payment gateways, and your order is confirmed only after successful transaction completion.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Shipping, Returns, and Refunds</h3>
              <p className="text-gray-700">
                Orders are typically processed within 1–3 business days. We offer flat-rate shipping of ₹149 for orders below ₹3000, while orders above ₹3000 qualify for free shipping. For full details, please refer to our Shipping Policy. Information regarding cancellations, returns, and refunds can be found in our Return & Refund Policy, which forms part of these Terms.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Privacy</h3>
              <p className="text-gray-700">
                Your privacy is important to us. Personal information collected during the order process is handled in accordance with our Privacy Policy, which outlines how we collect, use, and protect your data.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Limitation of Liability</h3>
              <p className="text-gray-700">
                JOOTA JUNCTION is not liable for any indirect, incidental, or consequential damages arising from the use of our website or products. All purchases are made at the user's discretion and risk, and we recommend reading all product details carefully before purchasing.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Governing Law</h3>
              <p className="text-gray-700">
                These Terms are governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts located in Udham Singh Nagar, Uttarakhand.
              </p>
            </section>

            <p className="text-gray-700 mt-6">
              If you continue to use this website, you agree to these Terms. We reserve the right to update them at any time without prior notice, so we encourage you to review them periodically.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions; 