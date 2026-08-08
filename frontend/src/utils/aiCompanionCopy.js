export const COMPANION_COPY = {
  '/dashboard':    { insight: "I'm watching your pipeline for stalled applications and upcoming deadlines.", prompt: 'How is my job search trending this week?' },
  '/companies':    { insight: 'I can help prioritize which companies to follow up with next.', prompt: 'Which companies should I focus on this week?' },
  '/applications': { insight: 'Ask me to review an application or suggest your next move.', prompt: 'Which of my applications need a follow-up?' },
  '/follow-ups':   { insight: "I'll flag overdue follow-ups before they go cold.", prompt: 'What follow-ups are overdue right now?' },
  '/recruiters':   { insight: 'I can suggest who to re-engage based on last contact date.', prompt: 'Who haven’t I contacted in a while?' },
  '/referrals':    { insight: 'I can help you draft a referral request message.', prompt: 'Help me write a referral request.' },
  '/goals':        { insight: "I'm tracking your progress toward each target.", prompt: 'Am I on pace to hit my goals?' },
  '/profile':      { insight: 'A strong profile gets more responses — want a quick review?', prompt: 'How can I improve my profile?' },
  '/workspaces':   { insight: 'Each workspace can track a different search focus.', prompt: 'Help me set up a new workspace.' },
}

export const DEFAULT_COMPANION_COPY = {
  insight: "I'm here if you need interview prep or a quick answer.",
  prompt: 'What should I focus on today?',
}

export function companionCopyFor(pathname) {
  return COMPANION_COPY[pathname] || DEFAULT_COMPANION_COPY
}
