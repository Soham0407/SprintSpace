import { Check } from 'lucide-react';

const COLUMNS: { label: string; cards: string[] }[] = [
  { label: 'To Do', cards: ['Landing page', 'Pitch deck'] },
  { label: 'In Progress', cards: ['Auth flow', 'AI context setup'] },
  { label: 'Done', cards: ['Database schema'] },
];

/**
 * The "after" layer — a calm, aligned SprintSpace kanban board. Rendered at
 * full opacity always; what makes it "hidden" is the CSS mask applied by
 * the parent (RevealMask), which only shows it inside the cursor spotlight.
 */
const CleanMockup = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink">
      <div className="w-full max-w-2xl px-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-primary text-sm font-medium">Web Wonders 2026</span>
          <span className="text-accent text-xs">87% health</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {COLUMNS.map((col) => (
            <div key={col.label} className="bg-card rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-gray-400">{col.label}</span>
                <span className="text-[10px] text-gray-600">{col.cards.length}</span>
              </div>
              <div className="space-y-2">
                {col.cards.map((card) => (
                  <div
                    key={card}
                    className="bg-surface rounded-lg px-2.5 py-2 text-[11px] text-primary/90 border border-white/5 flex items-center gap-1.5"
                  >
                    {col.label === 'Done' && <Check size={11} className="text-accent shrink-0" />}
                    {card}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CleanMockup;
