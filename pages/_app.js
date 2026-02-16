import "../styles/globals.css";
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <div className={inter.className}>
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default App;
