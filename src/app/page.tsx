import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { About } from "@/components/sections/About";
import { Cashback } from "@/components/sections/Cashback";
import { Cycle } from "@/components/sections/Cycle";
import { Dashboard } from "@/components/sections/Dashboard";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Intro } from "@/components/sections/Intro";
import { Microcredit } from "@/components/sections/Microcredit";
import { Numbers } from "@/components/sections/Numbers";
import { Score } from "@/components/sections/Score";
import { Security } from "@/components/sections/Security";
import { Tech } from "@/components/sections/Tech";
import { DemoStrip } from "@/components/ui/DemoStrip";
import { Particles } from "@/components/ui/Particles";

/**
 * Página única do piloto.
 *
 * Ordem de leitura: impacto → o que é → como funciona → produto → tecnologia
 * → confiança → ciclo → prova → convite.
 */
export default function Home() {
  return (
    <>
      <Particles />
      <Header />

      <main id="conteudo">
        <Hero />
        <DemoStrip />
        <Intro />
        <Microcredit />
        <Dashboard />
        <Score />
        <Tech />
        <Security />
        <Cycle />
        <Cashback />
        <Numbers />
        <About />
        <FinalCta />
      </main>

      <Footer />
    </>
  );
}
