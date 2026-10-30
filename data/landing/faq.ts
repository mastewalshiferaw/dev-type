export interface FaqItem {
  question: string;
  answer: string;
}

/** Also published as FAQPage structured data on the home page, so keep answers plain text. */
export const FAQ: readonly FaqItem[] = [
  {
    question: 'Is it free?',
    answer:
      'Yes. Every language, mode and stat is free, with no ads, trials or paid tier. The source code is on GitHub.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. Open the test and start typing. Your settings, history and personal bests stay in your browser. To join the leaderboard you only pick a username.',
  },
  {
    question: 'Which languages are supported?',
    answer:
      'JavaScript, TypeScript, Python, Rust, Go, C++, Java, C#, PHP, Ruby, Swift, Kotlin, SQL, HTML/CSS and Bash, or all of them mixed together.',
  },
  {
    question: 'How is WPM calculated?',
    answer:
      'WPM is correctly typed characters divided by five, per minute. Raw WPM counts every character you typed, mistakes included. Accuracy is correct keystrokes out of all keystrokes, so fixed mistakes still count. Auto-indentation never counts as typing.',
  },
  {
    question: 'Can I use my own code?',
    answer:
      'Yes. Custom mode takes up to 5,000 characters of anything you paste, so you can practice the exact code you write every day.',
  },
  {
    question: 'Does it work on mobile?',
    answer:
      'Yes. The test uses your phone’s own keyboard and the layout works down to 360 px wide. A hardware keyboard is still the way to chase a high score.',
  },
];
