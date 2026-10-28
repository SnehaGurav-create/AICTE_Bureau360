import './globals.css';

export const metadata = {
  title: 'AICTE Bureau360 — Integrated Complaint & Overlap Tracking Dashboard',
  description: 'AICTE SIH 2026 PS 26264: Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
