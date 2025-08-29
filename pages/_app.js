import "../styles/globals.css";
import { ThemeProvider } from '../contexts/ThemeContext';

function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default App;
