'use client'

import { useState } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface DocumentPreviewProps {
  fileUrl: string
  fileName: string
  fileType: string
  mimeType: string
  onClose: () => void
  onDownload?: () => void
}

const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']

export default function DocumentPreview({ fileUrl, fileName, fileType, mimeType, onClose, onDownload }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const isImage = IMAGE_TYPES.includes(fileType.toLowerCase())
  const isPDF = fileType.toLowerCase() === 'pdf'
  const canPreview = isImage || isPDF

  if (!canPreview) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm" onClick={e => e.stopPropagation()}>
          <p className="text-text-primary font-medium mb-2">Preview not available</p>
          <p className="text-sm text-text-muted mb-4">
            .{fileType} files cannot be previewed in browser.
          </p>
          {onDownload && (
            <button onClick={onDownload}
              className="px-4 py-2 bg-[#C9A96E] hover:bg-[#b89555] text-white rounded-lg text-sm font-medium transition-colors">
              Download Instead
            </button>
          )}
          <button onClick={onClose} className="block mx-auto mt-3 text-sm text-text-muted hover:text-text-primary">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={onClose}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50" onClick={e => e.stopPropagation()}>
        <div className="text-white text-sm font-medium truncate max-w-[50%]">{fileName}.{fileType}</div>
        <div className="flex items-center gap-1">
          {isImage && (
            <>
              <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <ZoomOut size={18} />
              </button>
              <span className="text-white/60 text-xs px-2">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <ZoomIn size={18} />
              </button>
              <button onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <RotateCw size={18} />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
            </>
          )}
          {onDownload && (
            <button onClick={onDownload}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Download size={18} />
            </button>
          )}
          <button onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {isImage && (
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxHeight: '80vh',
            }}
            draggable={false}
          />
        )}
        {isPDF && (
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full rounded-lg bg-white"
            style={{ maxWidth: '900px', minHeight: '80vh' }}
            title={fileName}
          />
        )}
      </div>
    </div>
  )
}
