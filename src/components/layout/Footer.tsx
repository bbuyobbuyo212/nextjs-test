import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__links">
        <div className="container">
          <ul className="footer__links__list">
            <li>
              <Link href="/terms">이용약관</Link>
            </li>
            <li>
              <Link href="/privacy">개인정보처리방침</Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer__content">
        <div className="container">
          <p className="copy">
            © 2024 My Community. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
