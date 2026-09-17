
import './globals.css';
import { Provider } from '@/components/provider';
import WelcomePopup from '@/components/WelcomePopup';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider>
          {children}
          <WelcomePopup />
        </Provider>
      </body>
    </html>
  );
}

