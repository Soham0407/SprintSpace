import { MessageCircle, FolderOpen, Table2, CalendarClock, AlertCircle, StickyNote } from 'lucide-react';

/**
 * The "before" layer — a deliberately cluttered scatter of the tools a
 * hackathon team juggles before SprintSpace: chat threads, a Drive folder,
 * a spreadsheet, a calendar with a red flag, a sticky note, a browser tab
 * bar buried in tabs. Positions/rotations are hand-placed (not random) so
 * the layout is stable across renders.
 */
const ChaosMockup = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-full max-w-2xl h-[420px] sm:h-[480px]">
        {/* Browser tab clutter */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 -rotate-2 bg-[#161616] border border-white/10 rounded-lg px-3 py-2 flex items-center gap-1.5 shadow-xl">
          {new Array(7).fill(0).map((_, i) => (
            <div key={i} className="w-9 h-6 rounded bg-white/10 border border-white/10" />
          ))}
          <span className="text-[10px] text-gray-500 ml-1">7 tabs open</span>
        </div>

        {/* WhatsApp-ish chat cluster */}
        <div className="absolute top-24 left-4 sm:left-10 -rotate-6 bg-[#161616] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-xl max-w-[190px]">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageCircle size={12} className="text-gray-500" />
            <span className="text-[10px] text-gray-500">Hackathon Squad 🔥</span>
          </div>
          <p className="text-xs text-gray-300">anyone free tonight?? need the deck by 9</p>
        </div>

        {/* Drive folder */}
        <div className="absolute top-8 right-6 sm:right-14 rotate-3 bg-[#161616] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
          <FolderOpen size={18} className="text-gray-500 mb-1.5" />
          <span className="text-[10px] text-gray-400">Final_v3_FINAL.pptx</span>
        </div>

        {/* Spreadsheet */}
        <div className="absolute bottom-28 left-8 sm:left-16 -rotate-3 bg-[#161616] border border-white/10 rounded-xl p-3 shadow-xl">
          <Table2 size={16} className="text-gray-500 mb-2" />
          <div className="grid grid-cols-3 gap-0.5">
            {new Array(9).fill(0).map((_, i) => (
              <div key={i} className="w-4 h-2.5 bg-white/10 rounded-[2px]" />
            ))}
          </div>
        </div>

        {/* Calendar with alert */}
        <div className="absolute bottom-24 right-4 sm:right-16 rotate-6 bg-[#161616] border border-white/10 rounded-xl px-4 py-3 shadow-xl flex items-center gap-2">
          <CalendarClock size={16} className="text-gray-500" />
          <span className="text-[10px] text-gray-400">Deadline: today</span>
          <AlertCircle size={13} className="text-red-500/80" />
        </div>

        {/* Sticky note */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rotate-2 bg-[#2a2416] border border-yellow-500/20 rounded-lg px-4 py-3 shadow-xl max-w-[160px]">
          <div className="flex items-center gap-1.5 mb-1">
            <StickyNote size={12} className="text-yellow-500/70" />
            <span className="text-[10px] text-yellow-500/70">note to self</span>
          </div>
          <p className="text-xs text-gray-300">due in 6 hrs and demo isn&apos;t working???</p>
        </div>

        {/* Scattered notification dots */}
        <div className="absolute top-20 right-1/3 w-2 h-2 rounded-full bg-red-500" />
        <div className="absolute bottom-32 right-8 w-1.5 h-1.5 rounded-full bg-red-500" />
        <div className="absolute top-1/2 left-6 w-1.5 h-1.5 rounded-full bg-red-500" />
      </div>
    </div>
  );
};

export default ChaosMockup;
