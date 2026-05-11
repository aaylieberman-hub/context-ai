import React, { useRef, useState, useCallback } from 'react'

interface FileUploadProps {
  onFileContent: (text: string, fileName: string) => void
  currentFileName: string
  currentPreview: string
}

export function FileUpload({ onFileContent, currentFileName, currentPreview }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'doc' || ext === 'docx') {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      onFileContent(result.value, file.name)
    } else {
      const text = await file.text()
      onFileContent(text, file.name)
    }
  }, [onFileContent])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div>
      <div
        className={`file-upload-zone ${dragover ? 'dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p>Drop a file here or click to browse</p>
        <p className="accepted">.txt, .md, .doc, .docx</p>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.doc,.docx"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>
      {currentFileName && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            {currentFileName}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
            {currentPreview.slice(0, 1000)}
            {currentPreview.length > 1000 && '...'}
          </div>
        </div>
      )}
    </div>
  )
}
