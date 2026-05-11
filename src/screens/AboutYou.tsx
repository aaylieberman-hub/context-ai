import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { TabBar } from '../components/TabBar'
import { FileUpload } from '../components/FileUpload'
import { useApp } from '../context/AppContext'
import { AboutYouForm } from '../types'

const TABS = ['Free Text', 'Upload', 'Form']

const FORM_FIELDS: { key: keyof AboutYouForm; label: string; type: 'input' | 'textarea'; placeholder: string }[] = [
  { key: 'name', label: 'Name', type: 'input', placeholder: 'Your name' },
  { key: 'role', label: 'Role', type: 'input', placeholder: 'e.g. Senior PM at Acme Corp' },
  { key: 'goals', label: 'Goals', type: 'textarea', placeholder: 'What are you working toward?' },
  { key: 'communicationStyle', label: 'Communication Style', type: 'textarea', placeholder: 'How do you prefer to communicate? Direct, diplomatic, detailed...' },
  { key: 'background', label: 'Background', type: 'textarea', placeholder: 'Your professional and personal background' },
  { key: 'currentProjects', label: 'Current Projects', type: 'textarea', placeholder: 'What are you currently working on?' },
]

export function AboutYou() {
  const { state, dispatch } = useApp()
  const [activeTab, setActiveTab] = useState('Free Text')

  return (
    <>
      <HeroBanner
        title="Tell us about yourself"
        subtitle="Add your personal context through text, files, or guided questions."
      />
      <div className="screen-content">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'Free Text' && (
          <div className="form-group">
            <textarea
              className="large"
              value={state.aboutYou.freeText}
              onChange={(e) => dispatch({ type: 'SET_FREE_TEXT', payload: e.target.value })}
              placeholder="Paste anything — your bio, goals, work situation, preferences, journal entries..."
            />
          </div>
        )}

        {activeTab === 'Upload' && (
          <FileUpload
            onFileContent={(text, fileName) =>
              dispatch({ type: 'SET_UPLOADED_TEXT', payload: { text, fileName } })
            }
            currentFileName={state.aboutYou.uploadedFileName}
            currentPreview={state.aboutYou.uploadedText}
          />
        )}

        {activeTab === 'Form' && (
          <div>
            {FORM_FIELDS.map(({ key, label, type, placeholder }) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                {type === 'input' ? (
                  <input
                    value={state.aboutYou.form[key]}
                    onChange={(e) =>
                      dispatch({ type: 'SET_FORM_FIELD', payload: { field: key, value: e.target.value } })
                    }
                    placeholder={placeholder}
                  />
                ) : (
                  <textarea
                    value={state.aboutYou.form[key]}
                    onChange={(e) =>
                      dispatch({ type: 'SET_FORM_FIELD', payload: { field: key, value: e.target.value } })
                    }
                    placeholder={placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
