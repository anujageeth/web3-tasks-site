// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Make sure case matches your actual file */}
        <link rel="icon" href="/Logo2025trans.png" type="image/png" />
        {/* Add more sizes for better support */}
        <link rel="apple-touch-icon" href="/Logo2025trans.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}