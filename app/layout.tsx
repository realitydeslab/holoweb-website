export const metadata = {
  title: "HoloWeb",
  description: "HoloWeb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <title>HoloWeb</title>
          <meta name="description" content="HoloWeb" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="apple-itunes-app" content="app-id=org.realitydeslab.holoweb, app-clip-bundle-id=org.realitydeslab.holoweb.Clip, app-clip-display=card" />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
