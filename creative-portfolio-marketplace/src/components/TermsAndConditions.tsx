import React from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronLeft, Calendar, FileText } from 'lucide-react';

interface TermsAndConditionsProps {
  onBackToHome: () => void;
}

export default function TermsAndConditions({ onBackToHome }: TermsAndConditionsProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header / Navigation Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-6">
        <div className="space-y-1">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-2.5 pt-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 uppercase tracking-tight">
              Terms & Conditions
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-wider self-start sm:self-center">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Updated July 2026</span>
        </div>
      </div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-150/80 rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-200/50 space-y-8"
      >
        <div className="prose prose-slate max-w-none">
          <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
            Welcome to our platform. By accessing or using our website, you agree to comply with these Terms and Conditions. If you do not agree with these terms, please do not use the platform.
          </p>
        </div>

        <div className="space-y-8 divide-y divide-slate-100">
          {/* Section 1 */}
          <div className="space-y-3 pt-6 first:pt-0">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">1</span>
              Eligibility
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed pl-8 font-medium">
              You must be at least 18 years old or have the permission of a parent or legal guardian to use this platform.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">2</span>
              User Accounts
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials.</p>
              <p className="leading-relaxed">You agree to provide accurate and up-to-date information during registration.</p>
              <p className="leading-relaxed">You are responsible for all activities conducted through your account.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">3</span>
              Our Platform
            </h2>
            <div className="pl-8 space-y-3 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">The platform connects clients with creative professionals, allowing users to:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li>Create professional portfolios.</li>
                <li>Browse creative professionals.</li>
                <li>Post creative jobs.</li>
                <li>Unlock contact details.</li>
                <li>Connect directly for projects.</li>
              </ul>
              <p className="leading-relaxed text-slate-400 italic">We do not employ creatives or guarantee that projects will be awarded.</p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">4</span>
              Contact Unlock Fee
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">Clients and creatives may be required to pay a contact unlock fee to access contact details.</p>
              <p className="leading-relaxed">Contact unlock fees are non-refundable once the contact details have been revealed.</p>
              <p className="leading-relaxed">Premium members may receive unlimited contact unlocks as part of their subscription.</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">5</span>
              Job Posting Limits
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">Each job allows a maximum of twenty (20) creatives to unlock the client's contact details.</p>
              <p className="leading-relaxed">Once the limit is reached, the job automatically closes.</p>
              <p className="leading-relaxed">Clients may reopen the job to allow another group of twenty (20) creatives to apply.</p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">6</span>
              Premium Membership
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">Premium membership provides additional features including portfolio enhancements and other benefits described on the Pricing page.</p>
              <p className="leading-relaxed">Subscription fees are billed in advance and are non-refundable except where required by law.</p>
              <p className="leading-relaxed">We reserve the right to modify Premium features at any time.</p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">7</span>
              Payments
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">All payments made through the platform are processed securely.</p>
              <p className="leading-relaxed">Fees paid for subscriptions, contact unlocks, or other digital services are generally non-refundable unless otherwise stated.</p>
            </div>
          </div>

          {/* Section 8 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">8</span>
              User Content
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">You retain ownership of the content you upload.</p>
              <p className="leading-relaxed">By uploading content, you grant us permission to display, store, and promote your content solely for operating and marketing the platform.</p>
              <p className="leading-relaxed">You confirm that you own the rights to all uploaded content.</p>
            </div>
          </div>

          {/* Section 9 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">9</span>
              Prohibited Conduct
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">Users must not:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
                <li>Upload illegal or offensive content.</li>
                <li>Upload copyrighted material without permission.</li>
                <li>Create fake accounts.</li>
                <li>Misrepresent their identity or qualifications.</li>
                <li>Harass or abuse other users.</li>
                <li>Use automated bots or scraping tools.</li>
                <li>Attempt to interfere with the platform's operation.</li>
              </ul>
              <p className="leading-relaxed text-red-500/90 font-semibold pt-1">Violation of these rules may result in suspension or permanent removal.</p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">10</span>
              Reviews
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">Reviews should reflect genuine experiences.</p>
              <p className="leading-relaxed">Fake, misleading, abusive, or defamatory reviews may be removed.</p>
            </div>
          </div>

          {/* Section 11 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">11</span>
              Platform Responsibility
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">We provide a marketplace for clients and creatives to connect.</p>
              <p className="leading-relaxed">We are not responsible for:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li>The quality of work delivered.</li>
                <li>Missed deadlines.</li>
                <li>Payment disputes between users.</li>
                <li>Losses arising from agreements made outside the platform.</li>
              </ul>
              <p className="leading-relaxed text-slate-400 italic pt-1">Users are responsible for conducting their own due diligence before entering into any agreement.</p>
            </div>
          </div>

          {/* Section 12 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">12</span>
              Account Suspension
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed pl-8 font-medium">
              We reserve the right to suspend or terminate any account that violates these Terms or engages in fraudulent, abusive, or unlawful activity.
            </p>
          </div>

          {/* Section 13 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">13</span>
              Privacy
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed pl-8 font-medium">
              Your personal information is handled in accordance with our Privacy Policy.
            </p>
          </div>

          {/* Section 14 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">14</span>
              Intellectual Property
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">The platform, including its branding, design, software, logos, and content, is protected by intellectual property laws.</p>
              <p className="leading-relaxed">Users may not copy, reproduce, or distribute any part of the platform without written permission.</p>
            </div>
          </div>

          {/* Section 15 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">15</span>
              Changes to These Terms
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">We may update these Terms and Conditions from time to time.</p>
              <p className="leading-relaxed">Continued use of the platform after changes are published constitutes acceptance of the revised Terms.</p>
            </div>
          </div>

          {/* Section 16 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">16</span>
              Governing Law
            </h2>
            <div className="pl-8 space-y-2 text-sm text-slate-500 font-medium">
              <p className="leading-relaxed">These Terms and Conditions are governed by the laws of the Republic of Kenya.</p>
              <p className="leading-relaxed">Any disputes shall be resolved in accordance with the applicable laws and courts of Kenya.</p>
            </div>
          </div>

          {/* Section 17 */}
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-mono font-black">17</span>
              Contact
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed pl-8 font-medium">
              If you have any questions regarding these Terms and Conditions, please contact us through the contact details provided on the platform.
            </p>
          </div>
        </div>

        {/* Back Button inside card for completion */}
        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={onBackToHome}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm hover:shadow-indigo-500/20"
          >
            Agree and Return Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
