import "./globals.css";

export const metadata = {
  title: "The Librarian",
  description: "Advanced Book Recommendation Engine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}