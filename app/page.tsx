'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, type SurveyResponse } from '@/lib/supabase'
import Chart from 'chart.js/auto'

const QUESTIONS = [
  { id: 'q1', text: '이번 도심 나들이와 생신 축하 자리는 평소 거주지(오지)에서 느꼈던 외로움이나 심리적 소외감을 해소하는 데 큰 도움이 되었다.' },
  { id: 'q2', text: "오늘 '특별한 존재로서 대접받고 인정받았다'는 기분이 들어 스스로에 대한 자아존중감과 삶의 활력이 고취되었다." },
  { id: 'q3', text: '나들이 중 지급받은 선물(반려식물 등)을 집에서 정성껏 돌보며 일상생활을 주도적으로 관리해 나갈 마음(동기)이 생겼다.' },
  { id: 'q4', text: '이번 활동을 계기로 어려운 일이나 위기 상황이 발생했을 때, 복지관이나 동행한 이웃에게 주저 없이 도움을 요청할 수 있다는 심리적 안도감이 들었다.' },
]

const TARGETS = ['권임연', '박갑춘', '안봉준']

export default function SurveyPage() {
  const [name, setName] = useState('')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    fetchResponses()
  }, [])

  useEffect(() => {
    renderChart()
  }, [responses])

  async function fetchResponses() {
    const { data } = await supabase
      .from('survey_responses')
      .select('*')
      .order('submitted_at', { ascending: false })
    if (data) setResponses(data)
  }

  function renderChart() {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    const averages = QUESTIONS.map(q => {
      if (responses.length === 0) return 0
      const sum = responses.reduce((acc, r) => acc + ((r[q.id as keyof SurveyResponse] as number) || 0), 0)
      return parseFloat((sum / responses.length).toFixed(1))
    })

    chartInstance.current = new Chart(chartRef.current, {
      type: 'radar',
      data: {
        labels: ['Q1.소외감해소', 'Q2.자아존중감', 'Q3.일상동기', 'Q4.심적안도감'],
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return

    const alreadySubmitted = responses.some(r => r.name === name)
    if (alreadySubmitted) {
      setMessage(`${name} 어르신의 설문 데이터가 이미 존재합니다.`)
      return
    }

    setLoading(true)
    const { error } = await supabase.from('survey_responses').insert({
      name,
      q1: answers.q1,
      q2: answers.q2,
      q3: answers.q3,
      q4: answers.q4,
    })

    if (error) {
      setMessage('저장 중 오류가 발생했습니다: ' + error.message)
    } else {
      setMessage(`${name} 어르신의 만족도 조사가 성공적으로 저장되었습니다!`)
      setName('')
      setAnswers({})
      await fetchResponses()
    }
    setLoading(false)
  }

  async function handleReset() {
    if (!confirm('정말 모든 데이터를 삭제하고 초기화하시겠습니까?')) return
    await supabase.from('survey_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setResponses([])
    setMessage('데이터가 초기화되었습니다.')
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <main className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">

        <div className="text-center border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-blue-800">소양강댐재가노인지원센터</h1>
          <h2 className="text-xl font-bold text-gray-700 mt-1">6월 재가대상자 생신나들이 욕구기반 만족도 조사</h2>
          <p className="text-sm text-gray-500 mt-2">※ 본 조사는 오지 노인의 정서적 위기 예방 및 자아존중감 변화를 측정하기 위한 척도 기반 설문입니다.</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="block text-lg font-bold text-gray-800 mb-2">1. 답변하시는 어르신의 성함을 선택해 주세요.</label>
            <select
              value={name}
              onChange={e => { setName(e.target.value); setMessage('') }}
              className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm font-bold text-gray-700 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- 어르신 선택 --</option>
              {TARGETS.map(t => (
                <option key={t} value={t}>{t} 어르신</option>
              ))}
            </select>
          </div>

          <hr className="border-gray-200" />

          <h3 className="text-xl font-bold text-gray-900">2. 생신나들이 활동을 통한 내면의 변화를 평가해 주세요.</h3>

          <div className="space-y-6">
            {QUESTIONS.map((q, idx) => (
              <div key={q.id} className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
                <p className="text-lg font-bold text-gray-900">
                  <span className="text-blue-700">Q{idx + 1}.</span> {q.text}
                </p>
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {[1, 2, 3, 4, 5].map(score => (
                    <label
                      key={score}
                      className={`flex items-center justify-center p-3 border rounded-md cursor-pointer transition font-medium text-sm
                        ${answers[q.id] === score
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={score}
                        checked={answers[q.id] === score}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: score }))}
                        className="sr-only"
                        required
                      />
                      {score}점
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-4 px-6 rounded-lg text-xl transition shadow-lg"
          >
            {loading ? '저장 중...' : '설문 결과 저장하기 (제출)'}
          </button>
        </form>

        <div className="mt-12 border-t-2 border-gray-300 pt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 실시간 만족도 및 정서지수 통계 결과</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-700 mb-2 text-center">제출한 어르신 명단</h4>
              {responses.length === 0 ? (
                <p className="p-3 text-center text-gray-400 text-sm">등록된 데이터가 없습니다.</p>
              ) : (
                <ul className="divide-y divide-gray-200 text-sm font-medium text-gray-600">
                  {responses.map(r => (
                    <li key={r.id} className="p-3 flex justify-between font-bold text-gray-700">
                      <span>👤 {r.name} 어르신</span>
                      <span className="text-blue-600 text-xs">{r.submitted_at ? formatDate(r.submitted_at) : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-center items-center">
              <h4 className="font-bold text-gray-700 mb-4 text-center">문항별 평균 점수 (5점 만점)</h4>
              <canvas ref={chartRef} className="w-full max-w-xs" />
            </div>
          </div>
          <div className="mt-4 text-right">
            <button
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded transition"
            >
              데이터 전체 초기화
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
