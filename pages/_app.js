import "../styles/globals.css";
import "../styles/utilities/layout.css";
import "../styles/utilities/colors.css";
import "../styles/utilities/typography.css";
import { ThemeProvider } from '../contexts/ThemeContext';
import { SessionProvider } from 'next-auth/react';

function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}

export default App;
