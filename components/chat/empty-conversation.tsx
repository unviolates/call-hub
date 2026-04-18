import { IconMessageSquare } from '@/components/icons';

export function EmptyConversation() {
  return (
    <section className="flex-1 min-w-0 h-full flex items-center justify-center p-8 text-center"
      style={{ background: 'var(--bg)' }}>
      <div className="max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] inline-flex items-center justify-center text-[var(--text-2)] mb-3.5">
          <IconMessageSquare size={22} />
        </div>
        <h3 className="text-[17px] font-semibold m-0 mb-1.5">Select a conversation</h3>
        <p className="text-[13.5px] text-[var(--text-2)] m-0 leading-relaxed">
          Pick someone from the list to continue the thread, or start a new message with the pencil icon.
        </p>
      </div>
    </section>
  );
}
