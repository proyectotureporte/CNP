"use client";

import Image from "next/image";

export default function InfoHero() {
  return (
    <section
      style={{
        width: "100%",
      }}
    >
      <Image
        src="/images/info.png"
        alt="Información CNP"
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </section>
  );
}
