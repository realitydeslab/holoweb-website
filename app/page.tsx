import Link from "next/link";

export default function Home() {

  return (
    <div className="container mx-auto px-4">
      <h1><Link href="launch?url=https://toji.github.io/webxr-particles/">Toji Example</Link></h1>
      <h1><Link href="launch?url=https://immersive-web.github.io/webxr-samples/immersive-ar-session.html">immersive-web Example</Link></h1>
    </div>
  );
}
