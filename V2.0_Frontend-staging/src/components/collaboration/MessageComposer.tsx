'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip, Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import MentionDropdown from './MentionDropdown'
import type { Participant } from './ContextPanel'

interface MentionData {
  user_id: string
  user_name: string
}

interface MessageComposerProps {
  onSendText: (text: string, metadata?: { mentions: MentionData[] }) => void
  onUpload: (file: File, caption: string) => void
  onTyping: (isTyping: boolean) => void
  disabled: boolean
  participants: Participant[]
}

export default function MessageComposer({ onSendText, onUpload, onTyping, disabled, participants }: MessageComposerProps) {
  const [text, setText] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mention state
  const [mentionActive, setMentionActive] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStartIndex, setMentionStartIndex] = useState(0)
  const [activeMentionIndex, setActiveMentionIndex] = useState(0)
  const [mentions, setMentions] = useState<MentionData[]>([])

  const filteredParticipants = participants.filter(
    p => p.user_name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5)

  const handleTextChange = (value: string) => {
    setText(value)
    // Typing indicator
    onTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => onTyping(false), 2000)

    // Mention detection
    const textarea = textareaRef.current
    if (!textarea) return
    const cursorPos = textarea.selectionStart

    // Find the last '@' before cursor
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex >= 0) {
      const charBefore = lastAtIndex === 0 ? ' ' : value[lastAtIndex - 1]
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)

      // Activate if @ is at start or preceded by whitespace, and no space in query
      if ((charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setMentionActive(true)
        setMentionStartIndex(lastAtIndex)
        setMentionQuery(textAfterAt)
        setActiveMentionIndex(0)
        return
      }
    }
    setMentionActive(false)
  }

  const selectMention = (participant: Participant) => {
    const before = text.slice(0, mentionStartIndex)
    const after = text.slice(mentionStartIndex + 1 + mentionQuery.length)
    const newText = `${before}@${participant.user_name} ${after}`
    setText(newText)

    // Add to mentions array (deduplicate)
    setMentions(prev => {
      if (prev.some(m => m.user_id === participant.user)) return prev
      return [...prev, { user_id: participant.user, user_name: participant.user_name }]
    })

    setMentionActive(false)
    setMentionQuery('')

    // Refocus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + 1 + participant.user_name.length + 1
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const handleSend = () => {
    if (pendingFile) {
      onUpload(pendingFile, text.trim())
      setPendingFile(null)
      setPreviewUrl(null)
      setText('')
      setMentions([])
      return
    }
    if (!text.trim()) return
    onSendText(text.trim(), mentions.length > 0 ? { mentions } : undefined)
    setText('')
    setMentions([])
    onTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionActive && filteredParticipants.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveMentionIndex(prev => Math.min(prev + 1, filteredParticipants.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveMentionIndex(prev => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        selectMention(filteredParticipants[activeMentionIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionActive(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [])

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
  }

  return (
    <div className="border-t border-border bg-white">
      {/* File preview */}
      {pendingFile && (
        <div className="px-4 pt-3 flex items-center gap-3">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <Paperclip size={20} className="text-text-muted" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{pendingFile.name}</p>
            <p className="text-[10px] text-text-muted">
              {(pendingFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button onClick={clearFile} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={14} className="text-text-muted" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="relative flex items-end gap-2 p-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Attach file"
        >
          <Camera size={18} className="text-text-muted" />
        </button>

        <div className="flex-1 relative">
          {/* Mention dropdown */}
          {mentionActive && (
            <MentionDropdown
              participants={participants}
              query={mentionQuery}
              activeIndex={activeMentionIndex}
              onSelect={selectMention}
              onClose={() => setMentionActive(false)}
            />
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? 'Add a caption...' : 'Type a message... Use @ to mention'}
            disabled={disabled}
            rows={1}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
            style={{ maxHeight: '100px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !pendingFile)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            text.trim() || pendingFile
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'bg-gray-100 text-text-light'
          )}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
