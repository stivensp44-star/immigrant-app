import { Question } from '../interview'

export const tpsQuestions: Question[] = [
  {
    id: 'country_of_citizenship',
    label: 'What country are you a citizen of?',
    type: 'text',
    required: true,
  },
  {
    id: 'entry_date_us',
    label: 'When did you most recently enter the United States?',
    type: 'date',
    required: true,
  },
  {
    id: 'current_status',
    label: 'What is your current immigration status, if any?',
    type: 'select',
    required: true,
    options: [
      { label: 'No current status', value: 'none' },
      { label: 'Parole', value: 'parole' },
      { label: 'Visitor', value: 'visitor' },
      { label: 'Student', value: 'student' },
      { label: 'Pending asylum', value: 'pending_asylum' },
      { label: 'Other', value: 'other' },
    ],
  },
  {
    id: 'continuous_presence',
    label: 'Have you maintained continuous physical presence in the United States?',
    type: 'yes_no',
    required: true,
  },
  {
    id: 'continuous_presence_explanation',
    label: 'Briefly explain the gaps or departures in your presence.',
    type: 'text',
    condition: {
      questionId: 'continuous_presence',
      value: 'no',
    },
  },
  {
    id: 'arrest_history',
    label: 'Have you ever been arrested, charged, or convicted of a crime?',
    type: 'yes_no',
    required: true,
  },
  {
    id: 'arrest_history_explanation',
    label: 'Provide a short summary of the arrest or charge history.',
    type: 'text',
    condition: {
      questionId: 'arrest_history',
      value: 'yes',
    },
  },
]
