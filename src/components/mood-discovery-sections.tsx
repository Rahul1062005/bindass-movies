import { type MoodLane } from "@/lib/movies";
import { MovieCards } from "./movie-cards";
import styles from "./mood-discovery-sections.module.css";

type MoodSectionConfig = {
  mood: MoodLane;
  title: string;
  blurb: string;
};

const moodSections: MoodSectionConfig[] = [
  {
    mood: "🧠 Mind-Bending",
    title: "Mind-Bending",
    blurb: "Ideas, mystery, and layered storytelling that reward close attention.",
  },
  {
    mood: "🌒 Dark Stories",
    title: "Dark Stories",
    blurb: "Bleak, moody picks with unsettling atmosphere and sharp edge.",
  },
  {
    mood: "😰 Edge-of-Seat",
    title: "Edge-of-Seat",
    blurb: "Tense thrillers and relentless pacing for high-adrenaline sessions.",
  },
  {
    mood: "💖 Emotional",
    title: "Emotional",
    blurb: "Character-driven journeys with heart, intimacy, and aftertaste.",
  },
];

export function MoodDiscoverySections() {
  return (
    <section className={styles.wrapper} aria-label="Mood-based discovery rows">
      {moodSections.map((section) => (
        <article className={styles.sectionCard} key={section.mood}>
          <header className={styles.sectionHeader}>
            <h2>{section.title}</h2>
            <p>{section.blurb}</p>
          </header>

          <MovieCards
            fixedMood={section.mood}
            limit={12}
            layout="row"
            showControls={false}
            showStatus={false}
            showRowArrows
          />
        </article>
      ))}
    </section>
  );
}
