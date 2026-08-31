import { AppointmentSection } from "@/components/appointment-section";
import { FeaturedFrames } from "@/components/home/featured-frames";
import { Hero } from "@/components/home/hero";
import { Lineage } from "@/components/home/lineage";
import { NativeVisionsBand } from "@/components/home/native-visions-band";
import { Reviews } from "@/components/home/reviews";
import { TrustStrip } from "@/components/home/trust-strip";
import { WhoWeServe } from "@/components/home/who-we-serve";
import { VisitSection } from "@/components/visit-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Lineage />
      <FeaturedFrames />
      <NativeVisionsBand />
      <WhoWeServe />
      <Reviews />
      <VisitSection />
      <AppointmentSection />
    </>
  );
}
