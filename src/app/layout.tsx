import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';
import CartDrawer from './components/CartDrawer';
// import CheckoutModal from './components/CheckoutModal';

export const metadata = {
  title: 'Crakcio Store',
  description: 'Tienda oficial de Crakcio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-background text-foreground transition-colors duration-300">
        <ThemeProvider>
          {children}
          {/* El drawer dentro del ThemeProvider */}
          <CartDrawer />
        </ThemeProvider>
      </body>
    </html>
  );
}