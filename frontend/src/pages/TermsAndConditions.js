import React from 'react';
import '../styles/Legal.css';

function TermsAndConditions() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms and Conditions</h1>
        <p className="last-updated">Last Updated: April 09, 2025</p>
        
        <section className="legal-section">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing and using Zotgraduator, you agree to be bound by these Terms and Conditions. 
            If you do not agree to these Terms, please do not use our service.
          </p>
        </section>
        
        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            Zotgraduator is an educational planning tool designed to help University of California, Irvine students 
            plan their academic journey. The service provides course scheduling recommendations, prerequisite tracking, 
            and graduation requirement monitoring.
          </p>
        </section>
        
        <section className="legal-section">
          <h2>3. User Accounts</h2>
          <p>
            To use certain features of Zotgraduator, you may be required to create an account. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account information</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use of your account</li>
          </ul>
          <p>
            We reserve the right to terminate accounts that violate these Terms or remain inactive for extended periods.
          </p>
        </section>
        
        <section className="legal-section">
          <h2>4. Acceptable Use</h2>
          <p>When using Zotgraduator, you agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
            <li>Transmit any viruses, malware, or other harmful code</li>
            <li>Use the service for any commercial purposes without our consent</li>
            <li>Share your account credentials with others</li>
          </ul>
        </section>
        
        <section className="legal-section">
          <h2>5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of Zotgraduator, including but not limited to text, graphics, 
            logos, icons, images, audio clips, digital downloads, and data compilations, are the exclusive property 
            of Zotgraduator and are protected by United States and international copyright, trademark, and other 
            intellectual property laws.
          </p>
        </section>
        
        <section className="legal-section">
          <h2>6. Disclaimer of Warranties</h2>
          <p>
            ZOTGRADUATOR IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
            EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, WE DISCLAIM ALL 
            WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
            AND NON-INFRINGEMENT.
          </p>
          <p>
            We do not guarantee that:
          </p>
          <ul>
            <li>The service will meet all your requirements</li>
            <li>The service will be uninterrupted, timely, secure, or error-free</li>
            <li>The results obtained from using the service will be accurate or reliable</li>
            <li>Any errors in the service will be corrected</li>
          </ul>
        </section>
        
        <section className="legal-section">
          <h2>7. Academic Advice Disclaimer</h2>
          <p>
            While Zotgraduator aims to provide accurate course planning information, all recommendations should be verified 
            with official university advisors. We are not a substitute for professional academic advising, and students 
            should consult with their department advisors for official guidance regarding graduation requirements.
          </p>
        </section>
        
        <section className="legal-section">
          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZOTGRADUATOR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
            DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul>
            <li>Your access to or use of or inability to access or use the service</li>
            <li>Any conduct or content of any third party on the service</li>
            <li>Any content obtained from the service</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content</li>
          </ul>
        </section>
        
        <section className="legal-section">
          <h2>9. Changes to These Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of significant changes 
            by posting the updated Terms on this page with a new effective date. Your continued use of Zotgraduator 
            after such modifications constitutes your acceptance of the revised Terms.
          </p>
        </section>
        
        <section className="legal-section">
          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of California, 
            without regard to its conflict of law provisions.
          </p>
        </section>
        
        <section className="legal-section">
          <h2>11. Contact Information</h2>
          <p>
            For any questions about these Terms, please contact us at:
          </p>
          <address>
            Zotgraduator Team<br />
            University of California, Irvine<br />
            Donald Bren School of Information and Computer Sciences<br />
            Email: ___@___.com
          </address>
        </section>
      </div>
    </div>
  );
}

export default TermsAndConditions;
