import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Parallax, Reveal } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";

export function NativeVisionsBand() {
  return (
    <section className="relative isolate overflow-hidden bg-ink py-24 text-canvas sm:py-32">
      <Parallax
        className="absolute inset-0 -z-10 opacity-30"
        distance={70}
      >
        {/* placeholder: replace with a macro shot of a real Native Visions temple. */}
        <Image
          src="/images/native-visions-art.png"
          alt=""
          fill
          sizes="100vw"
          className="scale-125 object-cover"
        />
      </Parallax>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40"
      />

      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-6">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
            Exclusive to Sundance
          </span>
          <h2 className="font-display text-3xl md:text-4xl">
            Native Visions Eyewear
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-canvas/75">
            Frames carrying the work of Native American artists &mdash; a line
            you will not find at a chain optical. We are proud to be the shop
            that carries it.
          </p>

          <Reveal delay={0.1}>
            <blockquote className="border-l-2 border-ember/60 pl-5">
              <p className="font-display text-xl leading-snug text-canvas/90">
                His grandmother named him Spa Poole &mdash; smoke. He ran away
                from mission school five times before his brother told him to go
                make art instead.
              </p>
              <footer className="mt-3 text-sm text-canvas/55">
                On Virgil &ldquo;Smoker&rdquo; Marchand, featured artist
              </footer>
            </blockquote>
          </Reveal>

          <div className="pt-2">
            <ButtonLink href="/native-visions" variant="onDark" size="lg">
              Read the story
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
