// Next.js client boundary. Coverity flags this as unused_expr (NO_EFFECT).
// coverity[unused_expr:SUPPRESS]
'use client';

import Error from "next/error";

export default function NotFound() {
  return (
      <section>
        <Error statusCode={404} />
      </section>
  );
}
