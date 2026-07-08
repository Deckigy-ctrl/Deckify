// Template gallery: canned example decks rendered live by presRenderSlide,
// so previews always match the real output (and each theme) exactly.
// Content rules: student-focused, uses the composed layouts, respects the
// field length limits in lib/ai/prompt.ts, and never uses em dashes.

import type { SlideData } from './themes/buildElements'

export interface DeckTemplate {
  key: string
  emoji: string
  label: string
  description: string
  /** Prefill for the "Use with AI" path (matches EXAMPLE_TOPICS shape). */
  ai: { topic: string; audience: string; goal: string; tone: string }
  slides: SlideData[]
}

export const DECK_TEMPLATES: DeckTemplate[] = [
  {
    key: 'thesis',
    emoji: '🎓',
    label: 'Thesis Defense',
    description: 'Research question to contribution: methodology, findings, and limitations for a committee.',
    ai: { topic: 'Defend my thesis on [your research topic]: research gap, methodology, key findings, and contribution', audience: 'committee', goal: 'defend', tone: 'academic' },
    slides: [
      { type: 'title', title: 'Predicting Reef Recovery with Machine Learning', subtitle: 'Thesis defense · Marine Science Program', img_need: 'low' },
      { type: 'text', title: 'The Research Gap', body: 'Reef restoration projects report survival rates but rarely predict them. No published model forecasts coral transplant survival from site conditions measured before planting.', img_need: 'high' },
      { type: 'timeline', title: 'Methodology: Three Phases Over 18 Months', steps: ['Field survey: 14 reef sites mapped, 2,400 coral fragments tagged', 'Model training: gradient boosting on 32 site and species features', 'Validation: blind prediction on 6 held-out sites for one year'] },
      { type: 'iconstat', title: 'Key Findings', stats: [{ value: '87%', label: 'Prediction accuracy on held-out sites' }, { value: '2.3×', label: 'Better than expert baseline' }, { value: '11', label: 'Site features that matter most' }] },
      { type: 'comparison', title: 'Model vs Expert Judgment', columns: ['Criterion', 'Experts', 'Model'], rows: [['Accuracy', '38%', '87%'], ['Time per site', '2 days', '4 minutes'], ['Cost per survey', 'High', 'Near zero'], ['Consistency', 'Varies', 'Stable']] },
      { type: 'bullets', title: 'Limitations and Threats to Validity', bullets: ['Training data covers one ocean basin; generalization to Caribbean reefs is untested.', 'Survival was measured at 12 months; longer horizons may shift feature importance.', 'Sensor drift on 2 of 14 sites required interpolation for 6 weeks of data.'], img_need: 'none' },
      { type: 'stat', title: 'Fragments whose survival the model predicted correctly', stat: '2,088', body: 'Of 2,400 tagged fragments across all validation sites.', img_need: 'none' },
      { type: 'text', title: 'Contribution and Future Work', body: 'This work delivers the first validated pre-planting survival model for coral restoration. Next: multi-basin training data and integration with restoration planning tools.', img_need: 'none' },
    ],
  },
  {
    key: 'seminar',
    emoji: '📚',
    label: 'Class Seminar',
    description: 'Explain a concept from first principles with examples, a comparison, and discussion points.',
    ai: { topic: 'Explain [your concept] to my classmates: definition, how it works, real examples, and why it matters', audience: 'class', goal: 'explain', tone: 'conversational' },
    slides: [
      { type: 'title', title: 'How Vaccines Train Your Immune System', subtitle: 'Class seminar · Biology 201', img_need: 'low' },
      { type: 'text', title: 'The Core Idea in One Sentence', body: 'A vaccine is a safe rehearsal: it shows your immune system a harmless preview of a pathogen so the real infection meets a prepared defense.', img_need: 'high' },
      { type: 'methodology', title: 'What Happens After the Injection', steps: ['Antigen presentation: immune cells carry vaccine fragments to lymph nodes', 'Clonal expansion: matching B and T cells multiply for two weeks', 'Memory formation: long-lived cells persist for years, ready to respond'] },
      { type: 'comparison', title: 'Vaccine Types Compared', columns: ['Type', 'Example', 'Speed to make'], rows: [['Inactivated', 'Polio (IPV)', 'Slow'], ['Subunit', 'Hepatitis B', 'Medium'], ['mRNA', 'COVID-19', 'Fast'], ['Viral vector', 'Ebola', 'Medium']] },
      { type: 'iconstat', title: 'Why It Matters', stats: [{ value: '154M', label: 'Deaths prevented since 1974 (WHO)' }, { value: '>90%', label: 'Measles cases drop after two doses' }, { value: '1980', label: 'Smallpox declared eradicated' }] },
      { type: 'quote', title: 'A milestone in public health', quote: 'The eradication of smallpox shows that ambitious global health goals are attainable.', attribution: 'World Health Organization, 1980' },
      { type: 'text', title: 'Discussion Questions', body: 'Why do some vaccines need boosters while others last decades? How should limited doses be allocated in an outbreak? What would change your own risk calculation?', img_need: 'none' },
    ],
  },
  {
    key: 'group',
    emoji: '👥',
    label: 'Group Project',
    description: 'Problem, approach, who did what, results, and recommendations, with clear team structure.',
    ai: { topic: 'Present our group project on [your project]: problem, approach, team roles, results, and recommendations', audience: 'group', goal: 'findings', tone: 'professional' },
    slides: [
      { type: 'title', title: 'Reducing Food Waste in the Campus Cafeteria', subtitle: 'Group 4 · Operations Management', img_need: 'low' },
      { type: 'stat', title: 'Food discarded by the cafeteria every week', stat: '410 kg', body: 'Measured over four weeks of waste audits in the main dining hall.', img_need: 'high' },
      { type: 'bullets', title: 'Our Approach and Team Roles', bullets: ['Mina and Fah ran the four-week waste audit and built the baseline dataset.', 'Ton interviewed 12 kitchen staff and mapped the food preparation workflow.', 'Praew designed and piloted the demand forecasting spreadsheet with staff.'], img_need: 'none' },
      { type: 'timeline', title: 'Eight Weeks from Audit to Pilot', steps: ['Weeks 1 to 4: baseline waste audit and staff interviews', 'Weeks 5 to 6: forecasting tool built and staff trained', 'Weeks 7 to 8: pilot run with daily tracking and adjustments'] },
      { type: 'iconstat', title: 'Pilot Results', stats: [{ value: '-34%', label: 'Waste vs baseline in pilot weeks' }, { value: '฿18k', label: 'Estimated monthly savings' }, { value: '9/12', label: 'Staff rated the tool easy to use' }] },
      { type: 'findings', title: 'What Drove the Waste', items: [{ label: 'Over-prepared rice and curry on Mondays', value: '41% of total' }, { label: 'No demand data shared between shifts', value: 'Root cause' }, { label: 'Portion sizes fixed regardless of turnout', value: '22% of total' }] },
      { type: 'text', title: 'Recommendations', body: 'Adopt the forecasting sheet across all three dining halls, share turnout data between shifts, and review portion sizes each term. Payback period is under one semester.', img_need: 'none' },
    ],
  },
  {
    key: 'report',
    emoji: '📊',
    label: 'Research Report',
    description: 'Lead with the key result, then the data, the analysis, and what should happen next.',
    ai: { topic: 'Present my research report on [your topic]: key result first, then data, analysis, and recommendations', audience: 'professor', goal: 'findings', tone: 'academic' },
    slides: [
      { type: 'title', title: 'Screen Time and Sleep Quality in First-Year Students', subtitle: 'Research report · Psychology Department', img_need: 'low' },
      { type: 'stat', title: 'Sleep quality drop for heavy evening screen users', stat: '-27%', body: 'Pittsburgh Sleep Quality Index scores, n = 214 first-year students.', img_need: 'none' },
      { type: 'methodology', title: 'How the Study Was Run', steps: ['Recruited 214 first-year students across three faculties', 'Two-week diary study with screen time logged automatically', 'Sleep quality measured with the validated PSQI instrument'] },
      { type: 'comparison', title: 'Light vs Heavy Evening Screen Use', columns: ['Measure', 'Under 1h', 'Over 3h'], rows: [['Sleep onset', '18 min', '43 min'], ['PSQI score', '4.1', '6.8'], ['Morning alertness', 'Normal', 'Reduced'], ['Caffeine intake', '1.2 cups', '2.6 cups']] },
      { type: 'bullets', title: 'Analysis: What Explains the Gap', bullets: ['Blue light exposure delays melatonin onset by roughly 40 minutes in our sample.', 'Content type matters: social feeds correlate worse than passive video.', 'The effect survives controlling for caffeine, workload, and exam periods.'], img_need: 'none' },
      { type: 'figure', title: 'Dose-Response Curve', caption: 'Sleep quality declines steadily beyond 90 minutes of evening screen use.', body: 'The inflection point near 90 minutes suggests a practical threshold for campus health guidance.', img_need: 'high' },
      { type: 'text', title: 'Recommendations', body: 'Campus health services should include a 90-minute evening screen guideline in orientation materials. A follow-up intervention study is planned for next semester.', img_need: 'none' },
    ],
  },
  {
    key: 'experiment',
    emoji: '🔬',
    label: 'Experiment Report',
    description: 'Aim, setup, procedure, results with uncertainty, and an honest error analysis.',
    ai: { topic: 'Present my lab experiment on [your experiment]: aim, setup, procedure, results, and error analysis', audience: 'professor', goal: 'findings', tone: 'academic' },
    slides: [
      { type: 'title', title: 'Measuring g with a Simple Pendulum', subtitle: 'Physics I laboratory report', img_need: 'low' },
      { type: 'text', title: 'Aim', body: 'Determine local gravitational acceleration by timing a pendulum across five lengths, and compare the result with the accepted value of 9.81 m/s².', img_need: 'none' },
      { type: 'figure', title: 'Experimental Setup', caption: 'Pendulum bob on a rigid stand with photogate timing at the swing midpoint.', body: 'The photogate removes human reaction time from period measurement, the dominant error in stopwatch methods.', img_need: 'high' },
      { type: 'methodology', title: 'Procedure', steps: ['Set pendulum length from 0.40 m to 1.20 m in five steps', 'Record 20 periods per length with the photogate, repeated 3 times', 'Fit T² against L; slope gives g through the small-angle formula'] },
      { type: 'iconstat', title: 'Results', stats: [{ value: '9.78', label: 'Measured g in m/s²' }, { value: '±0.06', label: '95% confidence interval' }, { value: '0.3%', label: 'Deviation from accepted value' }] },
      { type: 'bullets', title: 'Error Analysis', bullets: ['Length measurement to the bob center contributes the largest uncertainty at 0.4%.', 'Amplitude was kept under 10 degrees, keeping small-angle error below 0.1%.', 'Air resistance and pivot friction shorten the period; both bias g slightly low.'], img_need: 'none' },
      { type: 'text', title: 'Conclusion', body: 'The measured value 9.78 ± 0.06 m/s² agrees with the accepted 9.81 m/s² within uncertainty. The photogate method is precise enough that length measurement now dominates the error budget.', img_need: 'none' },
    ],
  },
  {
    key: 'book',
    emoji: '📖',
    label: 'Book Report',
    description: 'Themes, characters, and argument of a book, ending with your own assessment.',
    ai: { topic: 'Present my book report on [book title and author]: themes, key characters, argument, and my assessment', audience: 'class', goal: 'summarize', tone: 'conversational' },
    slides: [
      { type: 'title', title: 'Thinking, Fast and Slow by Daniel Kahneman', subtitle: 'Book report · Behavioral Economics', img_need: 'low' },
      { type: 'quote', title: 'The central claim', quote: 'Nothing in life is as important as you think it is, while you are thinking about it.', attribution: 'Daniel Kahneman, Thinking, Fast and Slow (2011)' },
      { type: 'comparison', title: 'The Two Systems', columns: ['Trait', 'System 1', 'System 2'], rows: [['Speed', 'Instant', 'Slow'], ['Effort', 'Automatic', 'Deliberate'], ['Strength', 'Pattern spotting', 'Logic and math'], ['Weakness', 'Biases', 'Laziness']] },
      { type: 'bullets', title: 'Three Ideas That Stuck With Me', bullets: ['Anchoring: the first number you hear pulls every later estimate toward it.', 'Loss aversion: losing 500 baht hurts about twice as much as winning it feels good.', 'The planning fallacy: we underestimate our own projects even when we know the statistics.'], img_need: 'none' },
      { type: 'timeline', title: 'How the Argument Builds', steps: ['Part 1: the two-system model of thinking', 'Parts 2 and 3: heuristics, biases, and overconfidence', 'Parts 4 and 5: prospect theory and the two selves'] },
      { type: 'text', title: 'My Assessment', body: 'The book is strongest when it stays close to the experiments. Some studies in the priming chapters have since failed to replicate, which Kahneman has acknowledged. Read it for the framework, hold the specifics lightly.', img_need: 'none' },
    ],
  },
]
