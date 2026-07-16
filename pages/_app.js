import "../styles/globals.css";
import Head from 'next/head';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SessionProvider } from 'next-auth/react';
import { LearnerProvider } from '../contexts/LearnerContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <LearnerProvider>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, viewport-fit=cover"
            />
          </Head>
          <div className={inter.className}>
            <Component {...pageProps} />
          </div>
        </LearnerProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default App;
