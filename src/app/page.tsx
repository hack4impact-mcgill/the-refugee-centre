import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-sandstone-100 text-navy-900">
      <header className="border-b border-sandstone-300 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <Image
            src="/trc-logo.svg"
            alt=""
            width={26}
            height={23}
            preload
            className="h-8 w-auto"
          />
          <p className="text-h6">The Refugee Centre</p>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-24">
          <p className="text-overline uppercase text-sandstone-700">
            Supporting refugees since 2015
          </p>
          <h1 className="mt-2 max-w-3xl text-h3 sm:text-h2">
            <span lang="fr">Bienvenue</span> | Welcome
          </h1>
          <p className="mt-6 max-w-xl text-body1 text-navy-700">
            We are a leading frontline organization for newcomers, with an
            expertise in serving refugees and refugee claimants. We have been
            building long-lasting and creative solutions to refugee settlements
            and integration in Tiohtià:ke/Montréal for 10 years.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="https://www.therefugeecentre.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-navy-900 px-5 py-3 text-label text-white transition-colors hover:bg-navy-800"
            >
              Visit our website
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-sandstone-300 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6 text-body2 text-navy-700">
          © {new Date().getFullYear()} The Refugee Centre
        </div>
      </footer>
    </div>
  );
}
