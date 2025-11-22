import { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import { Check, Plus, X, Scissors, RotateCcw, Download, Link2, FileDown, GripVertical, Loader2 } from 'lucide-react'
import './App.css'

function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfBytes, setPdfBytes] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [ranges, setRanges] = useState([{ start: 1, end: 1, name: '' }])
  const [dividedPdfs, setDividedPdfs] = useState([])
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const dragCounterRef = useRef(0)

  // Procesa un archivo PDF (se reutiliza para input y drop)
  const processFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Por favor, sube un archivo PDF válido')
      return
    }

    setIsLoading(true)
    setProcessingProgress({ current: 0, total: 100, message: 'Cargando archivo...' })

    try {
      setPdfFile(file)

      // Leer el archivo en chunks para archivos grandes
      const arrayBuffer = await file.arrayBuffer()
      setPdfBytes(arrayBuffer)

      setProcessingProgress({ current: 50, total: 100, message: 'Analizando PDF...' })

      // Usar setTimeout para no bloquear el hilo principal
      await new Promise(resolve => setTimeout(resolve, 0))

      // Obtener el número total de páginas
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: false,
        capNumbers: false,
        parseSpeed: 1 // Más rápido pero menos preciso para archivos grandes
      })
      const pages = pdfDoc.getPageCount()
      setTotalPages(pages)

      // Resetear rangos con el primer rango
      setRanges([{ start: 1, end: Math.min(1, pages), name: '' }])
      setDividedPdfs([])

      setProcessingProgress({ current: 100, total: 100, message: 'Completado' })
    } catch (error) {
      console.error('Error al cargar el PDF:', error)
      alert('Error al cargar el PDF. El archivo puede estar corrupto o ser demasiado grande.')
    } finally {
      setIsLoading(false)
      setTimeout(() => setProcessingProgress({ current: 0, total: 0, message: '' }), 500)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    await processFile(file)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragActive(false)
    }
  }

  const handleDragOverUpload = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDropFile = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    dragCounterRef.current = 0
    
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
    if (file) {
      // Reset the file input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
      await processFile(file)
    }
  }

  const handleRangeChange = (index, field, value) => {
    const newRanges = [...ranges]
    
    if (field === 'start' || field === 'end') {
      // Permitir cualquier valor mientras se escribe (incluyendo vacío)
      if (value === '') {
        newRanges[index][field] = ''
        setRanges(newRanges)
        return
      }
      
      const numValue = parseInt(value)
      // Si no es un número válido, no hacer nada
      if (isNaN(numValue)) {
        return
      }
      
      // Permitir escribir cualquier número, sin validar límites mientras se escribe
      // Solo actualizar el valor directamente
      newRanges[index][field] = numValue
    } else {
      newRanges[index][field] = value
    }
    
    setRanges(newRanges)
  }

  const handleRangeBlur = (index, field) => {
    const newRanges = [...ranges]
    let currentValue = newRanges[index][field]
    
    // Convertir a número si es string
    if (typeof currentValue === 'string' && currentValue !== '') {
      currentValue = parseInt(currentValue)
    }
    
    // Si el campo está vacío o no es un número válido, establecer un valor por defecto
    if (currentValue === '' || isNaN(currentValue) || currentValue === null || currentValue === undefined) {
      if (field === 'start') {
        newRanges[index].start = 1
        if (newRanges[index].start > newRanges[index].end) {
          newRanges[index].end = newRanges[index].start
        }
      } else if (field === 'end') {
        newRanges[index].end = Math.max(newRanges[index].start || 1, 1)
      }
      setRanges(newRanges)
      return
    }
    
    // Validar y ajustar el valor final cuando se pierde el foco
    if (field === 'start') {
      const validStart = Math.max(1, Math.min(currentValue, totalPages))
      newRanges[index].start = validStart
      // Ajustar 'end' si es necesario
      if (validStart > newRanges[index].end) {
        newRanges[index].end = validStart
      }
    } else if (field === 'end') {
      const validEnd = Math.max(newRanges[index].start || 1, Math.min(currentValue, totalPages))
      newRanges[index].end = validEnd
    }
    
    setRanges(newRanges)
  }

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1]
    const nextStart = lastRange.end + 1
    if (nextStart <= totalPages) {
      setRanges([...ranges, { 
        start: nextStart, 
        end: Math.min(nextStart, totalPages), 
        name: '' 
      }])
    }
  }

  const removeRange = (index) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((_, i) => i !== index))
    }
  }

  const dividePdf = async () => {
    if (!pdfBytes) return

    setIsProcessing(true)
    setProcessingProgress({ current: 0, total: ranges.length, message: 'Iniciando división...' })

    try {
      // Cargar el PDF fuente una sola vez
      setProcessingProgress({ current: 0, total: ranges.length, message: 'Cargando PDF fuente...' })
      const sourcePdf = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: false,
        capNumbers: false,
        parseSpeed: 1
      })
      
      // Permitir que el navegador respire
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const newDividedPdfs = []

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i]
        setProcessingProgress({ 
          current: i + 1, 
          total: ranges.length, 
          message: `Procesando rango ${i + 1} de ${ranges.length}...` 
        })
        
        const newPdf = await PDFDocument.create()
        
        // Copiar páginas del rango (convertir de 1-indexed a 0-indexed)
        // Procesar en batches pequeños para archivos grandes
        const pagesToCopy = []
        for (let pageNum = range.start - 1; pageNum < range.end; pageNum++) {
          pagesToCopy.push(pageNum)
        }
        
        // Copiar todas las páginas de una vez (más eficiente)
        const copiedPages = await newPdf.copyPages(sourcePdf, pagesToCopy)
        copiedPages.forEach((page) => {
          newPdf.addPage(page)
        })

        // Permitir que el navegador respire antes de guardar
        await new Promise(resolve => setTimeout(resolve, 0))
        
        const pdfBytes = await newPdf.save()
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        
        const fileName = range.name 
          ? `${range.name}.pdf` 
          : `rango_${range.start}-${range.end}.pdf`

        newDividedPdfs.push({
          id: i,
          url,
          fileName,
          range: `${range.start}-${range.end}`,
          blob
        })
        
        // Actualizar progresivamente para mejor UX
        setDividedPdfs([...newDividedPdfs])
        
        // Permitir que el navegador respire entre iteraciones
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      setProcessingProgress({ current: ranges.length, total: ranges.length, message: 'Completado' })
    } catch (error) {
      console.error('Error al dividir el PDF:', error)
      alert('Error al dividir el PDF. El archivo puede ser demasiado grande o estar corrupto.')
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingProgress({ current: 0, total: 0, message: '' }), 1000)
    }
  }

  const downloadSingle = (pdf) => {
    const link = document.createElement('a')
    link.href = pdf.url
    link.download = pdf.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAll = async () => {
    if (dividedPdfs.length === 0) return

    for (let i = 0; i < dividedPdfs.length; i++) {
      const pdf = dividedPdfs[i]
      // Esperar un poco entre descargas para evitar problemas del navegador
      await new Promise(resolve => setTimeout(resolve, 100 * i))
      downloadSingle(pdf)
    }
  }

  const mergeAllPdfs = async () => {
    if (dividedPdfs.length === 0) return

    setIsProcessing(true)
    setProcessingProgress({ current: 0, total: dividedPdfs.length, message: 'Iniciando unión...' })

    try {
      const mergedPdf = await PDFDocument.create()

      // Unir todos los PDFs divididos en el orden en que fueron creados
      for (let i = 0; i < dividedPdfs.length; i++) {
        const pdf = dividedPdfs[i]
        setProcessingProgress({ 
          current: i + 1, 
          total: dividedPdfs.length, 
          message: `Uniendo archivo ${i + 1} de ${dividedPdfs.length}...` 
        })
        
        const pdfBytes = await pdf.blob.arrayBuffer()
        const sourcePdf = await PDFDocument.load(pdfBytes, {
          ignoreEncryption: false,
          capNumbers: false,
          parseSpeed: 1
        })
        const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
        
        pages.forEach((page) => {
          mergedPdf.addPage(page)
        })
        
        // Permitir que el navegador respire
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      setProcessingProgress({ current: dividedPdfs.length, total: dividedPdfs.length, message: 'Guardando PDF unido...' })
      
      // Permitir que el navegador respire antes de guardar
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      // Crear nombre para el PDF unido
      const mergedFileName = pdfFile 
        ? `${pdfFile.name.replace('.pdf', '')}_unido.pdf`
        : 'pdf_unido.pdf'

      // Descargar el PDF unido
      const link = document.createElement('a')
      link.href = url
      link.download = mergedFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Limpiar la URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      setProcessingProgress({ current: dividedPdfs.length, total: dividedPdfs.length, message: 'Completado' })
    } catch (error) {
      console.error('Error al unir los PDFs:', error)
      alert('Error al unir los PDFs. El archivo puede ser demasiado grande.')
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingProgress({ current: 0, total: 0, message: '' }), 1000)
    }
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newDividedPdfs = [...dividedPdfs]
    const draggedItem = newDividedPdfs[draggedIndex]
    
    // Remover el elemento arrastrado
    newDividedPdfs.splice(draggedIndex, 1)
    
    // Insertar en la nueva posición
    newDividedPdfs.splice(dropIndex, 0, draggedItem)
    
    // Actualizar los IDs para mantener la consistencia
    newDividedPdfs.forEach((pdf, index) => {
      pdf.id = index
    })
    
    setDividedPdfs(newDividedPdfs)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const reset = () => {
    setPdfFile(null)
    setPdfBytes(null)
    setTotalPages(0)
    setRanges([{ start: 1, end: 1, name: '' }])
    setDividedPdfs([])
    setDraggedIndex(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Limpiar URLs creadas
    dividedPdfs.forEach(pdf => URL.revokeObjectURL(pdf.url))
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Ruba Split Pdf</h1>
        
        <div className="upload-section">
          <div
            className={`upload-area ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOverUpload}
            onDragLeave={handleDragLeave}
            onDrop={handleDropFile}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              id="pdf-upload"
              className="file-input"
            />
            <label htmlFor="pdf-upload" className="upload-label" style={{ opacity: isLoading ? 0.6 : 1 }}>
              {isLoading ? (
                <div className="upload-content">
                  <Loader2 className="upload-icon" size={48} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{processingProgress.message || 'Cargando...'}</span>
                  {processingProgress.total > 0 && (
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : pdfFile ? (
                <div className="upload-content">
                  <Check className="upload-icon" size={32} />
                  <span className="file-name">{pdfFile.name}</span>
                  <span className="file-info">{totalPages} páginas</span>
                </div>
              ) : (
                <div className="upload-content">
                  <img src="/assets/pdf-file.png" alt="PDF icon" className="upload-icon-image" />
                  <span>Haz clic para subir un PDF</span>
                  <span className="drag-hint">o arrastra y suelta un archivo aquí</span>
                </div>
              )}
            </label>
          </div>
        </div>

        {pdfFile && (
          <>
            <div className="ranges-section">
              <h2>Rangos de Páginas</h2>
              <div className="ranges-list">
                {ranges.map((range, index) => (
                  <div key={index} className="range-item">
                    <div className="range-inputs">
                      <div className="input-group">
                        <label>Desde:</label>
                        <input
                          type="number"
                          value={range.start}
                          onChange={(e) => handleRangeChange(index, 'start', e.target.value)}
                          onBlur={() => handleRangeBlur(index, 'start')}
                          className="number-input"
                          placeholder="1"
                        />
                      </div>
                      <div className="input-group">
                        <label>Hasta:</label>
                        <input
                          type="number"
                          value={range.end}
                          onChange={(e) => handleRangeChange(index, 'end', e.target.value)}
                          onBlur={() => handleRangeBlur(index, 'end')}
                          className="number-input"
                          placeholder={totalPages.toString()}
                        />
                      </div>
                      <div className="input-group">
                        <label>Nombre (opcional):</label>
                        <input
                          type="text"
                          value={range.name}
                          onChange={(e) => handleRangeChange(index, 'name', e.target.value)}
                          placeholder={`Rango ${index + 1}`}
                          className="text-input"
                        />
                      </div>
                    </div>
                    {ranges.length > 1 && (
                      <button
                        onClick={() => removeRange(index)}
                        className="remove-btn"
                        title="Eliminar rango"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addRange} className="add-range-btn" disabled={ranges[ranges.length - 1]?.end >= totalPages}>
                <Plus size={20} />
                Agregar Rango
              </button>
            </div>

            {(isProcessing || processingProgress.message) && (
              <div className="progress-section">
                <div className="progress-info">
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{processingProgress.message}</span>
                </div>
                {processingProgress.total > 0 && (
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="actions-section">
              <button onClick={dividePdf} className="divide-btn" disabled={isProcessing || isLoading}>
                {isProcessing ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Scissors size={20} />
                    Dividir PDF
                  </>
                )}
              </button>
              <button onClick={reset} className="reset-btn" disabled={isProcessing || isLoading}>
                <RotateCcw size={20} />
                Reiniciar
              </button>
            </div>
          </>
        )}

        {dividedPdfs.length > 0 && (
          <div className="results-section">
            <h2>Archivos Divididos</h2>
            <div className="pdfs-list">
              {dividedPdfs.map((pdf, index) => (
                <div
                  key={pdf.id}
                  className={`pdf-item ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="drag-handle">
                    <GripVertical size={20} />
                  </div>
                  <div className="pdf-info">
                    <span className="pdf-name">{pdf.fileName}</span>
                    <span className="pdf-range">Páginas: {pdf.range}</span>
                  </div>
                  <button
                    onClick={() => downloadSingle(pdf)}
                    className="download-btn"
                  >
                    <Download size={18} />
                    Descargar
                  </button>
                </div>
              ))}
            </div>
            <div className="bulk-actions">
              <button onClick={downloadAll} className="download-all-btn" disabled={isProcessing || isLoading}>
                <FileDown size={20} />
                Descargar Todos los Archivos
              </button>
              <button onClick={mergeAllPdfs} className="merge-btn" disabled={isProcessing || isLoading}>
                {isProcessing ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Uniendo PDFs...
                  </>
                ) : (
                  <>
                    <Link2 size={20} />
                    Unir y Descargar como un Solo PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

