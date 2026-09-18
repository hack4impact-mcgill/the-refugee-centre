export default function Home() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-overline uppercase text-sandstone-700">
        Supporting refugees since 2015
      </p>
      <h1 className="mt-2 max-w-3xl text-h3 sm:text-h2">
        <span lang="fr">Bienvenue</span> | Welcome
      </h1>
      <p className="mt-6 max-w-xl text-body1 text-navy-700">
        We are a leading frontline organization for newcomers, with an expertise
        in serving refugees and refugee claimants. We have been building
        long-lasting and creative solutions to refugee settlements and
        integration in Tiohtià:ke/Montréal for 10 years.
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
  );
}
