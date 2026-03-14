import type { Movie, MovieQuery } from "./types";

export const movieSeedCatalog: Movie[] = [
  {
    id: "mov-drive-2011",
    slug: "drive-2011",
    title: "Drive",
    year: 2011,
    director: "Nicolas Winding Refn",
    runtimeMinutes: 100,
    moodLane: "😰 Edge-of-Seat",
    aftertaste: "Unsettled",
    intensity: 3,
    endingType: "Ambiguous",
    watchRisk: ["Slow burn", "Graphic violence", "Bleak themes"],
    verdict:
      "A restrained crime romance where silence is more dangerous than dialogue.",
    synopsis:
      "A stunt driver moonlighting as a getaway driver gets pulled into a spiral of betrayal.",
    highlight: ["Neon-noir tone", "Minimal dialogue tension", "Iconic synth score"],
  },
  {
    id: "mov-oldboy-2003",
    slug: "oldboy-2003",
    title: "Oldboy",
    year: 2003,
    director: "Park Chan-wook",
    runtimeMinutes: 120,
    moodLane: "🌒 Dark Stories",
    aftertaste: "Devastated",
    intensity: 5,
    endingType: "Twist-driven",
    watchRisk: [
      "Graphic violence",
      "Psychological tension",
      "Bleak themes",
    ],
    verdict:
      "An operatic revenge tragedy that weaponizes style without losing emotional brutality.",
    synopsis:
      "After years of unexplained imprisonment, a man seeks answers and revenge.",
    highlight: ["Hallway fight sequence", "Moral collapse arc", "Devastating reveal"],
  },
  {
    id: "mov-nightcrawler-2014",
    slug: "nightcrawler-2014",
    title: "Nightcrawler",
    year: 2014,
    director: "Dan Gilroy",
    runtimeMinutes: 117,
    moodLane: "🌒 Dark Stories",
    aftertaste: "Unsettled",
    intensity: 4,
    endingType: "Existential",
    watchRisk: ["Psychological tension", "Bleak themes"],
    verdict:
      "A chilling media-age character study where ambition mutates into predation.",
    synopsis:
      "An opportunistic outsider builds a career filming violent late-night crime scenes.",
    highlight: ["Predatory protagonist", "Sharp social critique", "Claustrophobic tension"],
  },
  {
    id: "mov-past-lives-2023",
    slug: "past-lives-2023",
    title: "Past Lives",
    year: 2023,
    director: "Celine Song",
    runtimeMinutes: 106,
    moodLane: "💖 Emotional",
    aftertaste: "Bittersweet",
    intensity: 2,
    endingType: "Open-ended",
    watchRisk: ["Slow burn", "Emotional heavy"],
    verdict:
      "A gentle but piercing portrait of timing, identity, and unrealized possibility.",
    synopsis:
      "Two childhood friends reconnect across decades and continents.",
    highlight: ["Subtle emotional pacing", "Diaspora identity lens", "Quiet final scene"],
  },
  {
    id: "mov-her-2013",
    slug: "her-2013",
    title: "Her",
    year: 2013,
    director: "Spike Jonze",
    runtimeMinutes: 126,
    moodLane: "🤔 Thoughtful",
    aftertaste: "Reflective",
    intensity: 2,
    endingType: "Open-ended",
    watchRisk: ["Slow burn", "Emotional heavy"],
    verdict:
      "A near-future love story that asks whether intimacy is emotional, physical, or both.",
    synopsis:
      "A lonely writer forms a deep connection with an AI operating system.",
    highlight: ["Warm future aesthetic", "Intimate voice work", "Loneliness themes"],
  },
  {
    id: "mov-in-the-mood-for-love-2000",
    slug: "in-the-mood-for-love-2000",
    title: "In the Mood for Love",
    year: 2000,
    director: "Wong Kar-wai",
    runtimeMinutes: 98,
    moodLane: "🔥 Slow Burn",
    aftertaste: "Bittersweet",
    intensity: 2,
    endingType: "Ambiguous",
    watchRisk: ["Slow burn", "Emotional heavy"],
    verdict:
      "A masterpiece of restraint where longing is expressed through rhythm, space, and repetition.",
    synopsis:
      "Two neighbors suspect their spouses are unfaithful and slowly grow close.",
    highlight: ["Visual poetry", "Unspoken desire", "Iconic score and costume design"],
  },
  {
    id: "mov-parasite-2019",
    slug: "parasite-2019",
    title: "Parasite",
    year: 2019,
    director: "Bong Joon-ho",
    runtimeMinutes: 132,
    moodLane: "🧠 Mind-Bending",
    aftertaste: "Unsettled",
    intensity: 4,
    endingType: "Existential",
    watchRisk: ["Psychological tension", "Bleak themes"],
    verdict:
      "A genre-shifting class thriller with precision structure and ruthless social commentary.",
    synopsis:
      "A struggling family infiltrates a wealthy household through a series of deceptions.",
    highlight: ["Genre pivots", "Class metaphor architecture", "Layered production design"],
  },
  {
    id: "mov-get-out-2017",
    slug: "get-out-2017",
    title: "Get Out",
    year: 2017,
    director: "Jordan Peele",
    runtimeMinutes: 104,
    moodLane: "😰 Edge-of-Seat",
    aftertaste: "Reflective",
    intensity: 4,
    endingType: "Twist-driven",
    watchRisk: ["Psychological tension", "Graphic violence"],
    verdict:
      "A razor-sharp horror satire that turns social anxiety into cinematic suspense.",
    synopsis:
      "A young man uncovers disturbing truths while meeting his girlfriend's family.",
    highlight: ["Sunken Place symbolism", "Satirical dread", "Tense pacing"],
  },
  {
    id: "mov-mad-max-fury-road-2015",
    slug: "mad-max-fury-road-2015",
    title: "Mad Max: Fury Road",
    year: 2015,
    director: "George Miller",
    runtimeMinutes: 120,
    moodLane: "🏔️ Big Epic",
    aftertaste: "Euphoric",
    intensity: 5,
    endingType: "Resolved",
    watchRisk: ["Graphic violence", "Bleak themes"],
    verdict:
      "A relentless action symphony where visual storytelling never loses thematic purpose.",
    synopsis:
      "In a desert wasteland, rebels race across a deadly landscape to escape tyranny.",
    highlight: ["Practical action craft", "Feminist resistance arc", "World-building through motion"],
  },
  {
    id: "mov-zodiac-2007",
    slug: "zodiac-2007",
    title: "Zodiac",
    year: 2007,
    director: "David Fincher",
    runtimeMinutes: 157,
    moodLane: "🔥 Slow Burn",
    aftertaste: "Unsettled",
    intensity: 4,
    endingType: "Open-ended",
    watchRisk: ["Slow burn", "Psychological tension", "Bleak themes"],
    verdict:
      "An obsessive procedural about the cost of not knowing and the weight of unresolved truth.",
    synopsis:
      "Journalists and investigators become consumed by the hunt for a serial killer.",
    highlight: ["Atmospheric realism", "Obsession arc", "Meticulous direction"],
  },
  {
    id: "mov-before-sunrise-1995",
    slug: "before-sunrise-1995",
    title: "Before Sunrise",
    year: 1995,
    director: "Richard Linklater",
    runtimeMinutes: 101,
    moodLane: "☀️ Feel Good",
    aftertaste: "Hopeful",
    intensity: 1,
    endingType: "Open-ended",
    watchRisk: ["Slow burn"],
    verdict:
      "A conversational romance that proves chemistry and curiosity can carry an entire film.",
    synopsis:
      "Two strangers spend one night walking through Vienna and talking about life.",
    highlight: ["Natural dialogue flow", "Youthful sincerity", "Timeless romantic setup"],
  },
  {
    id: "mov-arrival-2016",
    slug: "arrival-2016",
    title: "Arrival",
    year: 2016,
    director: "Denis Villeneuve",
    runtimeMinutes: 116,
    moodLane: "🧠 Mind-Bending",
    aftertaste: "Reflective",
    intensity: 3,
    endingType: "Existential",
    watchRisk: ["Slow burn", "Emotional heavy", "Complex timeline"],
    verdict:
      "A cerebral first-contact drama that uses language to explore grief, choice, and time.",
    synopsis:
      "A linguist is recruited to decode alien communication as global tension rises.",
    highlight: ["Language as plot engine", "Emotional science fiction", "Elegant narrative reveal"],
  },
];

export function getAllMovies(): Movie[] {
  return [...movieSeedCatalog];
}

export function findMovieBySlug(slug: string): Movie | undefined {
  return movieSeedCatalog.find((movie) => movie.slug === slug);
}

export function queryMovies(query: MovieQuery = {}): Movie[] {
  const normalizedSearch = query.search?.trim().toLowerCase();

  const filtered = movieSeedCatalog
    .filter((movie) => (query.mood ? movie.moodLane === query.mood : true))
    .filter((movie) =>
      query.endingType ? movie.endingType === query.endingType : true,
    )
    .filter((movie) =>
      query.maxIntensity ? movie.intensity <= query.maxIntensity : true,
    )
    .filter((movie) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        movie.title,
        movie.director,
        movie.synopsis,
        movie.verdict,
        ...movie.highlight,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }

      return a.title.localeCompare(b.title);
    });

  if (query.limit && query.limit > 0) {
    return filtered.slice(0, query.limit);
  }

  return filtered;
}
