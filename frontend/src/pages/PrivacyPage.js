import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{...styles.logoContainer, cursor: 'pointer'}} onClick={() => navigate('/')}>
            <img src="/gappy-logo1.png" alt="Gappy Describe" style={styles.logoText} />
          </div>
          <nav style={styles.nav}>
            <button onClick={() => navigate('/')} style={{...styles.navLink, background: 'none', border: 'none', cursor: 'pointer'}}>Home</button>
            <button onClick={() => navigate('/pricing')} style={{...styles.navLink, background: 'none', border: 'none', cursor: 'pointer'}}>Pricing</button>
          </nav>
        </div>
      </header>

      {/* Privacy Policy Content */}
      <div style={styles.content}>
        <div style={styles.contentInner}>
          <h1 style={styles.title}>Privacy Policy</h1>
          <p style={styles.effectiveDate}>Effective date: December 9, 2024</p>

          <section style={styles.section}>
            <p style={styles.text}>
              This Privacy Policy explains how Gappy Labs LLC ("Gappy Labs", "we", "us", "our") collects, uses, and shares information when you use Gappy Describe (the "Service").
            </p>
            <p style={styles.text}>
              If you have any questions, you can contact us at:<br />
              Email: <a href="mailto:gappylabs@gmail.com" style={styles.link}>gappylabs@gmail.com</a>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>1. Who we are</h2>
            <p style={styles.text}>
              Gappy Describe is a product of Gappy Labs LLC, a company focused on tools for curriculum and media design in education. This Privacy Policy applies when you access or use Gappy Describe or otherwise interact with us in connection with the Service.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>2. What this policy covers</h2>
            <p style={styles.text}>
              This Privacy Policy applies to:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>The Gappy Describe website and web application;</li>
              <li style={styles.listItem}>Any browser-based experience we make available for Gappy Describe; and</li>
              <li style={styles.listItem}>Our communications and support interactions related to the Service.</li>
            </ul>
            <p style={styles.text}>
              It does not apply to third-party services that we do not control, such as your institution's learning management system ("LMS") or video-hosting platforms. Those services have their own privacy policies.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>3. Information we collect</h2>
            
            <h3 style={styles.subheading}>3.1 Account & contact information</h3>
            <p style={styles.text}>
              When you create or manage an account, we collect:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Name and email address;</li>
              <li style={styles.listItem}>Profile picture (if provided via Google OAuth or manually uploaded);</li>
              <li style={styles.listItem}>Authentication credentials (passwords are stored in hashed form using industry-standard bcrypt);</li>
              <li style={styles.listItem}>Subscription tier and account preferences;</li>
              <li style={styles.listItem}>Communication preferences and support correspondence.</li>
            </ul>

            <h3 style={styles.subheading}>3.2 Content you upload (videos & descriptions)</h3>
            <p style={styles.text}>
              To provide the Service, we process and store the content you choose to upload, including:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Video files you upload to our servers;</li>
              <li style={styles.listItem}>AI-generated scene descriptions and audio narration;</li>
              <li style={styles.listItem}>Video thumbnails and scene metadata;</li>
              <li style={styles.listItem}>Project titles, timestamps, and export preferences;</li>
              <li style={styles.listItem}>Any edits or customizations you make to generated descriptions.</li>
            </ul>
            <p style={styles.text}>
              You are responsible for ensuring you have the right to upload and process this content, including any personal data it may contain.
            </p>

            <h3 style={styles.subheading}>3.3 Usage & device information</h3>
            <p style={styles.text}>
              When you use the Service, we automatically collect certain technical and usage information, such as:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Log data (IP address, browser type, device type, operating system);</li>
              <li style={styles.listItem}>Dates, times, and duration of access;</li>
              <li style={styles.listItem}>Pages and features used, and basic interactions (e.g., buttons clicked);</li>
              <li style={styles.listItem}>Approximate location based on IP address (e.g., city, region);</li>
              <li style={styles.listItem}>Session tokens for maintaining authenticated sessions.</li>
            </ul>
            <p style={styles.text}>
              We use this information in aggregated form to understand how the Service is used and to maintain performance and security.
            </p>

            <h3 style={styles.subheading}>3.4 Cookies & similar technologies</h3>
            <p style={styles.text}>
              We use cookies and similar technologies to:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Keep you signed in and maintain sessions via JWT tokens;</li>
              <li style={styles.listItem}>Remember your settings and preferences;</li>
              <li style={styles.listItem}>Analyze usage and improve the Service;</li>
              <li style={styles.listItem}>Implement auto-logout after periods of inactivity for security.</li>
            </ul>
            <p style={styles.text}>
              You can usually configure your browser to refuse cookies or indicate when a cookie is being sent. Some features of the Service may not function properly without cookies.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>4. How we use information</h2>
            <p style={styles.text}>
              We use the information described above for the following purposes:
            </p>

            <h3 style={styles.subheading}>To provide and operate the Service</h3>
            <ul style={styles.list}>
              <li style={styles.listItem}>Process and store videos on our secure servers;</li>
              <li style={styles.listItem}>Analyze videos using FFmpeg to detect scene changes;</li>
              <li style={styles.listItem}>Generate AI-powered descriptions using OpenAI's GPT-4o model;</li>
              <li style={styles.listItem}>Create audio narration using text-to-speech technology;</li>
              <li style={styles.listItem}>Export videos with embedded audio descriptions in your chosen format;</li>
              <li style={styles.listItem}>Display your projects, timelines, and settings;</li>
              <li style={styles.listItem}>Enforce subscription tier limits (video count, export formats).</li>
            </ul>

            <h3 style={styles.subheading}>To communicate with you</h3>
            <ul style={styles.list}>
              <li style={styles.listItem}>Respond to inquiries and support requests;</li>
              <li style={styles.listItem}>Send transactional messages (e.g., account notices, security alerts);</li>
              <li style={styles.listItem}>Send information about new features or changes, where permitted.</li>
            </ul>

            <h3 style={styles.subheading}>To maintain security and prevent misuse</h3>
            <ul style={styles.list}>
              <li style={styles.listItem}>Monitor for abusive or unauthorized activity;</li>
              <li style={styles.listItem}>Protect against fraud, spam, and security threats;</li>
              <li style={styles.listItem}>Implement session management and auto-logout for inactive users.</li>
            </ul>

            <h3 style={styles.subheading}>To analyze and improve the Service</h3>
            <ul style={styles.list}>
              <li style={styles.listItem}>Understand how features are used;</li>
              <li style={styles.listItem}>Develop new capabilities and user experiences;</li>
              <li style={styles.listItem}>Compile aggregated, de-identified statistics.</li>
            </ul>

            <h3 style={styles.subheading}>To comply with legal obligations</h3>
            <ul style={styles.list}>
              <li style={styles.listItem}>Comply with applicable laws, regulations, and legal processes;</li>
              <li style={styles.listItem}>Enforce our Terms of Use and other agreements.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>5. How AI processing works</h2>
            <p style={styles.text}>
              Gappy Describe uses AI models to analyze videos and generate descriptive text.
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>We use <strong>OpenAI's GPT-4o</strong> model to generate WCAG-compliant audio descriptions of video scenes;</li>
              <li style={styles.listItem}>We use <strong>FFmpeg</strong> and <strong>PySceneDetect</strong> to analyze video files and detect scene changes;</li>
              <li style={styles.listItem}>We use <strong>gTTS (Google Text-to-Speech)</strong> to convert text descriptions into audio;</li>
              <li style={styles.listItem}>Your videos are temporarily stored on our secure servers during processing and permanently stored until you delete them;</li>
              <li style={styles.listItem}>Generated outputs (descriptions, audio files, thumbnails) are stored in our database so you can view, edit, and export them later.</li>
            </ul>
            <p style={styles.text}>
              <strong>Important:</strong> We use OpenAI's API under their terms of service. OpenAI states that API data is not used to train their models unless you opt in. We have not opted in, and we use reasonable contractual and technical measures to ensure your content is processed only to deliver the Service to you.
            </p>
            <p style={styles.text}>
              We do not sell your videos or generated descriptions, and we do not permit third-party processors to sell your data.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>6. When we share information</h2>
            <p style={styles.text}>
              We may share information in the following situations:
            </p>

            <h3 style={styles.subheading}>Service providers:</h3>
            <p style={styles.text}>
              With trusted third parties that perform services on our behalf:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}><strong>MongoDB Atlas</strong> - Database hosting and storage;</li>
              <li style={styles.listItem}><strong>OpenAI</strong> - AI-powered description generation (GPT-4o);</li>
              <li style={styles.listItem}><strong>Google</strong> - Authentication services (Google OAuth) and text-to-speech;</li>
              <li style={styles.listItem}><strong>Emergent</strong> - Cloud hosting infrastructure;</li>
              <li style={styles.listItem}>Analytics and monitoring tools for service improvement.</li>
            </ul>
            <p style={styles.text}>
              These providers are contractually required to protect your data and use it only for the purposes we specify.
            </p>

            <h3 style={styles.subheading}>Institutional administrators:</h3>
            <p style={styles.text}>
              If your access is provided by an institution (e.g., a university or medical school), certain account and usage information may be visible to authorized administrators of that institution. (This feature is planned for future Canvas LTI integration.)
            </p>

            <h3 style={styles.subheading}>Legal and safety:</h3>
            <p style={styles.text}>
              When we believe disclosure is reasonably necessary to comply with a law, regulation, legal process, or governmental request; to enforce our terms and policies; or to protect the rights, property, or safety of Gappy Labs, our users, or others.
            </p>

            <h3 style={styles.subheading}>Business transfers:</h3>
            <p style={styles.text}>
              In connection with a merger, acquisition, reorganization, sale of assets, or similar transaction. We will take reasonable steps to ensure any successor entity honors this Policy or provides you with notice of changes.
            </p>

            <p style={styles.text}>
              <strong>We do not sell personal information to third parties.</strong>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>7. Data storage, location, and retention</h2>
            <p style={styles.text}>
              We store data on servers located in the United States and other jurisdictions where we or our service providers operate.
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}><strong>Account data:</strong> Stored in MongoDB Atlas while your account is active and for a limited period afterward, unless deleted earlier;</li>
              <li style={styles.listItem}><strong>Video files:</strong> Stored on our secure servers until you delete them or your account is closed;</li>
              <li style={styles.listItem}><strong>Generated content:</strong> Descriptions, audio files, and thumbnails are stored until you delete them;</li>
              <li style={styles.listItem}><strong>Session data:</strong> JWT tokens expire after 24 hours or when you log out;</li>
              <li style={styles.listItem}><strong>Logs:</strong> May be retained for a limited period for security and debugging purposes.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>8. Security</h2>
            <p style={styles.text}>
              We use reasonable technical and organizational measures to protect your information, including:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>HTTPS encryption for all data in transit;</li>
              <li style={styles.listItem}>Password hashing using bcrypt;</li>
              <li style={styles.listItem}>JWT-based authentication with secure token management;</li>
              <li style={styles.listItem}>Auto-logout after 10 minutes of inactivity;</li>
              <li style={styles.listItem}>Access controls and authentication requirements for all sensitive operations;</li>
              <li style={styles.listItem}>Regular security monitoring and updates.</li>
            </ul>
            <p style={styles.text}>
              However, no online service can guarantee absolute security. You are responsible for using a strong password and keeping your account credentials confidential.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>9. Your rights & choices</h2>
            <p style={styles.text}>
              Depending on your location, you may have certain rights regarding your personal information, including the right to:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Access and obtain a copy of the information we hold about you;</li>
              <li style={styles.listItem}>Request correction of inaccurate or incomplete information;</li>
              <li style={styles.listItem}>Request deletion of your information and uploaded content;</li>
              <li style={styles.listItem}>Object to or restrict certain types of processing;</li>
              <li style={styles.listItem}>Withdraw consent where processing is based on consent;</li>
              <li style={styles.listItem}>Export your data in a portable format.</li>
            </ul>
            <p style={styles.text}>
              To exercise these rights, please contact us at <a href="mailto:gappylabs@gmail.com" style={styles.link}>gappylabs@gmail.com</a>. We may need to verify your identity before processing your request.
            </p>
            <p style={styles.text}>
              You can delete your projects and videos directly from your dashboard at any time.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>10. Education, student, and sensitive data</h2>
            <p style={styles.text}>
              Gappy Describe is designed primarily for use by institutions, faculty, and staff.
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>You are responsible for ensuring that you have the authority to upload and process any content that may contain personal data, including student information;</li>
              <li style={styles.listItem}>You should not upload protected health information (PHI) or other highly sensitive data to the Service unless you have a separate written agreement with us;</li>
              <li style={styles.listItem}>If you are subject to FERPA, HIPAA, or similar regulations, it is your responsibility to use the Service in a compliant manner.</li>
            </ul>
            <p style={styles.text}>
              If you are an institution and would like to discuss specific data-protection or security requirements, please contact us.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>11. Children's privacy</h2>
            <p style={styles.text}>
              The Service is not directed to children under the age of 13, and we do not knowingly collect personal data directly from children. Accounts are intended for institutions and adult professionals.
            </p>
            <p style={styles.text}>
              If you believe that a child has provided us with personal information, please contact us so we can take appropriate steps.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>12. Changes to this Privacy Policy</h2>
            <p style={styles.text}>
              We may update this Privacy Policy from time to time. When we do, we will revise the "Effective date" at the top of the page, and for material changes we may provide additional notice (such as email notifications).
            </p>
            <p style={styles.text}>
              Your continued use of the Service after the updated Policy takes effect constitutes your acceptance of the changes.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>13. How to contact us</h2>
            <p style={styles.text}>
              If you have questions, concerns, or complaints about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p style={styles.text}>
              Email: <a href="mailto:gappylabs@gmail.com" style={styles.link}>gappylabs@gmail.com</a>
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLeft}>
            <img src="/gappy-labs-logo-white-text.png" alt="Gappy Labs" style={styles.footerLogo} />
            <p style={styles.footerText}>© 2025 All rights reserved.</p>
          </div>
          <div style={styles.footerLinks}>
            <button onClick={() => navigate('/privacy')} style={{...styles.footerLink, background: 'none', border: 'none', cursor: 'pointer'}}>Privacy</button>
            <a href="#" style={styles.footerLink}>Terms</a>
            <a href="#" style={styles.footerLink}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 0',
    background: 'white',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  logoText: {
    height: '32px',
    width: 'auto',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navLink: {
    fontSize: '16px',
    color: '#4a5568',
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  content: {
    flex: 1,
    padding: '60px 24px',
    background: '#f9fafb',
  },
  contentInner: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    padding: '48px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '48px',
    fontWeight: '800',
    marginBottom: '8px',
    color: '#1a202c',
  },
  effectiveDate: {
    fontSize: '16px',
    color: '#718096',
    marginBottom: '32px',
  },
  section: {
    marginBottom: '32px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1a202c',
  },
  subheading: {
    fontSize: '20px',
    fontWeight: '600',
    marginTop: '20px',
    marginBottom: '12px',
    color: '#2d3748',
  },
  text: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#4a5568',
    marginBottom: '16px',
  },
  list: {
    marginLeft: '24px',
    marginBottom: '16px',
  },
  listItem: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#4a5568',
    marginBottom: '8px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
  },
  footer: {
    padding: '48px 24px',
    background: '#1a202c',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  footerLogo: {
    height: '28px',
    width: 'auto',
  },
  footerText: {
    color: '#a0aec0',
    fontSize: '14px',
    margin: 0,
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
  },
  footerLink: {
    color: '#a0aec0',
    fontSize: '14px',
    textDecoration: 'none',
    fontFamily: 'inherit',
  },
};

export default PrivacyPage;
