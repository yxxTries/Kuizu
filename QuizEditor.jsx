import { useState } from 'react'
import axios from 'axios'

export default function QuizEditor({ quiz, onReset }) {
  const [questions, setQuestions] = useState(quiz.questions)

  function updateQuestion(i, field, value) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  function removeQuestion(i) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i))
  }

  async function exportKahoot() {
    const { data } = await axios.post('/api/export/kahoot', questions, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    Object.assign(document.createElement('a'), { href: url, download: 'quiz.csv' }).click()
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{questions.length} questions ready</h2>
        <div className="flex gap-3">
          <button onClick={onReset} className="px-4 py-2 border rounded-lg hover:bg-gray-50">New upload</button>
          <button onClick={exportKahoot} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Export Kahoot CSV</button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <div key={i} className="border rounded-lg p-4 flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Slide {q.slide_number} · difficulty {q.difficulty}</span>
              <button onClick={() => removeQuestion(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            </div>
            <input
              className="font-medium border-b pb-1 focus:outline-none"
              value={q.question}
              onChange={e => updateQuestion(i, 'question', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[q.correct_answer, ...q.distractors].map((ans, j) => (
                <input
                  key={j}
                  className={`text-sm border rounded px-2 py-1 focus:outline-none ${j === 0 ? 'border-green-400' : 'border-gray-200'}`}
                  value={ans}
                  onChange={e => {
                    if (j === 0) updateQuestion(i, 'correct_answer', e.target.value)
                    else {
                      const d = [...q.distractors]
                      d[j - 1] = e.target.value
                      updateQuestion(i, 'distractors', d)
                    }
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
