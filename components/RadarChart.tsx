'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import type { SurveyResponse } from '@/lib/supabase'

const QUESTION_LABELS = ['Q1.소외감해소', 'Q2.자아존중감', 'Q3.일상동기', 'Q4.심적안도감']
const QUESTION_KEYS = ['q1', 'q2', 'q3', 'q4']

export default function RadarChart({ responses }: { responses: SurveyResponse[] }) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    const averages = QUESTION_KEYS.map(key => {
      if (responses.length === 0) return 0
      const sum = responses.reduce((acc, r) => acc + ((r[key as keyof SurveyResponse] as number) || 0), 0)
      return parseFloat((sum / responses.length).toFixed(1))
    })

    chartInstance.current = new Chart(chartRef.current, {
      type: 'radar',
      data: {
        labels: QUESTION_LABELS,
        datasets: [{
          label: '평균 점수',
          data: averages,
          backgroundColor: 'rgba(29, 78, 216, 0.2)',
          borderColor: 'rgba(29, 78, 216, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(29, 78, 216, 1)',
        }],
      },
      options: {
        responsive: true,
        scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } },
      },
    })

    return () => { chartInstance.current?.destroy() }
  }, [responses])

  return <canvas ref={chartRef} className="w-full max-w-xs" />
}
