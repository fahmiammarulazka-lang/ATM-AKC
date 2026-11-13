import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __gmpQuotaExceeded?: boolean;
  }
}

window.__gmpQuotaExceeded = false;
const QUOTA_PATTERNS = /OverQuotaMapError|OVER_QUERY_LIMIT|RESOURCE_EXHAUSTED|quota exceeded|rateLimitExceeded/i;
const notifyQuota = (msg: string) => {
  if (!window.__gmpQuotaExceeded && QUOTA_PATTERNS.test(msg)) {
    window.__gmpQuotaExceeded = true;
    window.dispatchEvent(new Event('gmp-quota-exceeded'));
  }
};
window.addEventListener('error', (e) => notifyQuota(e.message || ''));
const origError = console.error;
console.error = (...args) => {
  notifyQuota(args.map(String).join(' '));
  origError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(<App />);

