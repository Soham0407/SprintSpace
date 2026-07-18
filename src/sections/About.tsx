import WordsPullUpMultiStyle from '../components/animations/WordsPullUpMultiStyle';
import ScrollRevealText from '../components/animations/ScrollRevealText';

const About = () => {
  return (
    <section id="ai-engine" className="bg-ink px-4 md:px-6 py-20 md:py-28">
      <div className="bg-card rounded-2xl md:rounded-[2rem] max-w-6xl mx-auto px-6 py-16 md:px-14 md:py-24 text-center">
        <span className="block text-primary text-[10px] sm:text-xs tracking-[0.2em] mb-6">
          THE AI CONTEXT ENGINE
        </span>

        <WordsPullUpMultiStyle
          containerClassName="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[0.95] sm:leading-[0.9] max-w-3xl mx-auto mb-8"
          segments={[
            { text: 'Six apps, one deadline,', className: 'font-normal text-primary' },
            { text: 'zero visibility.', className: 'font-display text-accent' },
            {
              text: 'One workspace fixes that.',
              className: 'font-normal text-primary',
            },
          ]}
        />

        <ScrollRevealText
          className="text-[#DEDBC8] text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          text="Every SprintSpace workspace runs on a single AI Context Engine that reads your competition rulebook, tracks every task, and watches the timeline as it moves. Because it understands the whole project at once, every answer it gives — what to build next, what's blocking you, whether you'll make the deadline — is grounded in your actual work, not a generic guess."
        />
      </div>
    </section>
  );
};

export default About;
