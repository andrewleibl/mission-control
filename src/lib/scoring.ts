// Lead scoring algorithm
import { LeadAnswer, PipelineStatus } from '@/types/lead'

// Question IDs for reference (update with actual Facebook/GHL field IDs)
export const QUESTION_MAPPINGS = {
  q1_projectType: ['What type of project', 'project_type', 'q1'],
  q2_reason: ['main reason', 'reason', 'q2'],
  q3_timeline: ['When are you', 'timeline', 'q3'],
  q4_budget: ['budget', 'range', 'q4'],
  q5_ready: ['ready to move', 'quote', 'q5']
}

// Extract answer by matching question text
export function extractAnswer(
  answers: LeadAnswer[],
  searchTerms: string[]
): string {
  const match = answers.find(a => 
    searchTerms.some(term => 
      a.question.toLowerCase().includes(term.toLowerCase())
    )
  )
  return match?.answer?.toLowerCase() || ''
}

// Score individual answers
export function scoreAnswers(answers: LeadAnswer[]): number {
  let score = 0
  
  // Q1: Project Type (max 3)
  const q1 = extractAnswer(answers, QUESTION_MAPPINGS.q1_projectType)
  if (q1.includes('full remodel')) score += 3
  else if (q1.includes('turf') || q1.includes('partial')) score += 1
  
  // Q2: Reason (max 3)
  const q2 = extractAnswer(answers, QUESTION_MAPPINGS.q2_reason)
  if (q2.includes('unusable') || q2.includes('event')) score += 3
  else if (q2.includes('exploring') || q2.includes('looking')) score += 1
  
  // Q3: Timeline (max 3)
  const q3 = extractAnswer(answers, QUESTION_MAPPINGS.q3_timeline)
  if (q3.includes('asap') || q2.includes('1-2 week')) score += 3
  else if (q3.includes('month') || q3.includes('1-3')) score += 1
  
  // Q4: Budget (max 3)
  const q4 = extractAnswer(answers, QUESTION_MAPPINGS.q4_budget)
  if (q4.includes('5,000') || q4.includes('5000+') || q4.includes('5k+')) score += 3
  else if (q4.includes('500') || q4.includes('2,000')) score += 1
  
  // Q5: Ready for quote (max 2)
  const q5 = extractAnswer(answers, QUESTION_MAPPINGS.q5_ready)
  if (q5.includes('yes')) score += 2
  else if (q5.includes('maybe')) score += 1
  
  return score // Max 14 points
}

// Convert 14-point scale to 1-10
export function normalizeScore(score: number): number {
  return Math.round((score / 14) * 10)
}

// Determine Hot/Warm/Cold status
export function determineStatus(
  score: number,
  answers: LeadAnswer[]
): PipelineStatus {
  const criteria = checkCriteria(answers)
  let met = 0
  if (criteria.hasBudget) met++
  if (criteria.hasTimeline) met++
  if (criteria.hasLocation) met++
  
  if (met === 3) return 'Hot'
  if (met >= 1) return 'Warm'
  return 'Cold'
}

// Check which criteria are met
export function checkCriteria(answers: LeadAnswer[]): {
  hasBudget: boolean
  hasTimeline: boolean
  hasLocation: boolean
} {
  const q3 = extractAnswer(answers, QUESTION_MAPPINGS.q3_timeline)
  const q4 = extractAnswer(answers, QUESTION_MAPPINGS.q4_budget)
  
  const hasTimeline = !q3.includes('researching') && q3.length > 0
  const hasBudget = !q4.includes('under') && !q4.includes('unsure') && q4.length > 0
  
  // Check for location in any answer
  const hasLocation = answers.some(a => 
    a.question.toLowerCase().includes('address') ||
    a.question.toLowerCase().includes('location')
  ) || answers.some(a => a.answer.length > 3)
  
  return { hasBudget, hasTimeline, hasLocation }
}
