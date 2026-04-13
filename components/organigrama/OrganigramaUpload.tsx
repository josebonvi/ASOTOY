"use client"

import { useCallback, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  X,
  CheckCircle2,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"

interface OrganigramaUploadProps {
  concesionarioId: string
  onComplete: () => void
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "application/vnd.ms-powerpoint": [".ppt"],
}

const ACCEPT_STRING = Object.entries(ACCEPTED_TYPES)
  .flatMap(([mime, exts]) => [mime, ...exts])
  .join(",")

const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

type UploadStatus = "idle" | "uploading" | "success" | "error"

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return <FileText className="size-6 text-red-400" />
  if (["png", "jpg", "jpeg", "webp"].includes(ext))
    return <ImageIcon className="size-6 text-blue-400" />
  if (["xlsx", "xls"].includes(ext))
    return <FileSpreadsheet className="size-6 text-green-400" />
  if (["pptx", "ppt"].includes(ext))
    return <Presentation className="size-6 text-orange-400" />
  return <FileText className="size-6 text-muted-foreground" />
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isValidFile(file: File): string | null {
  const ext = `.${file.name.split(".").pop()?.toLowerCase()}`
  const validExts = Object.values(ACCEPTED_TYPES).flat()
  if (!validExts.includes(ext)) {
    return `Tipo de archivo no permitido: ${ext}`
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `El archivo excede el límite de 20 MB (${formatFileSize(file.size)})`
  }
  return null
}

export default function OrganigramaUpload({
  concesionarioId,
  onComplete,
}: OrganigramaUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((selected: File) => {
    const err = isValidFile(selected)
    if (err) {
      setErrorMsg(err)
      setStatus("error")
      return
    }
    setFile(selected)
    setErrorMsg("")
    setStatus("idle")
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped) handleFile(dropped)
    },
    [handleFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) handleFile(selected)
    },
    [handleFile]
  )

  const removeFile = useCallback(() => {
    setFile(null)
    setStatus("idle")
    setProgress(0)
    setErrorMsg("")
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return

    setStatus("uploading")
    setProgress(0)
    setErrorMsg("")

    const supabase = createClient()
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filePath = `${concesionarioId}/${timestamp}_${safeName}`

    try {
      // Simulate progress since supabase-js doesn't expose upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 200)

      const { error: uploadError } = await supabase.storage
        .from("organigramas")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      clearInterval(progressInterval)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      setProgress(95)

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("organigramas").getPublicUrl(filePath)

      // Create record in organigramas table
      const { error: insertError } = await supabase
        .from("organigramas")
        .insert({
          concesionario_id: concesionarioId,
          tipo: "upload",
          archivo_url: publicUrl,
          archivo_nombre: file.name,
          archivo_tipo: file.type,
          archivo_size: file.size,
          notas: notes || null,
          storage_path: filePath,
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Update concesionario estado
      const { error: updateError } = await supabase
        .from("concesionarios")
        .update({ organigrama_estado: "pendiente" })
        .eq("id", concesionarioId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setProgress(100)
      setStatus("success")

      // Call onComplete after a brief delay so user sees the success state
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err) {
      setStatus("error")
      setErrorMsg(
        err instanceof Error ? err.message : "Error desconocido al subir"
      )
      setProgress(0)
    }
  }, [file, concesionarioId, notes, onComplete])

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <motion.div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !file && inputRef.current?.click()}
        animate={{
          borderColor: isDragOver
            ? "var(--color-primary)"
            : "var(--color-border)",
          scale: isDragOver ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-muted-foreground/50 hover:bg-muted/30"
        } ${file ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={onInputChange}
          className="hidden"
          title="Seleccionar archivo de organigrama"
          aria-label="Seleccionar archivo de organigrama"
        />

        <AnimatePresence mode="wait">
          {isDragOver ? (
            <motion.div
              key="drag"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-2"
            >
              <Upload className="size-10 text-primary" />
              <p className="text-sm font-medium text-primary">
                Suelta el archivo aquí
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-2"
            >
              <Upload className="size-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Arrastra tu organigrama aquí
              </p>
              <p className="text-xs text-muted-foreground">
                o haz clic para seleccionar un archivo
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                PDF, imágenes, Excel o PowerPoint — máx. 20 MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Selected file preview */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              {getFileIcon(file.name)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {status !== "uploading" && status !== "success" && (
                <button
                  type="button"
                  title="Eliminar archivo"
                  onClick={removeFile}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 className="size-5 text-green-400" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      <AnimatePresence>
        {status === "uploading" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Progress value={progress}>
              <ProgressLabel className="text-muted-foreground">
                Subiendo...
              </ProgressLabel>
              <ProgressValue />
            </Progress>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {status === "error" && errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-destructive"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {status === "success" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm font-medium text-green-400"
          >
            ¡Organigrama subido exitosamente!
          </motion.p>
        )}
      </AnimatePresence>

      {/* Notes textarea */}
      <div className="space-y-2">
        <Textarea
          placeholder="Notas adicionales sobre su organigrama..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={status === "uploading" || status === "success"}
          className="resize-none"
          rows={3}
        />
      </div>

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={!file || status === "uploading" || status === "success"}
        className="w-full"
        size="lg"
      >
        {status === "uploading" ? (
          "Subiendo..."
        ) : status === "success" ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Subido
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Upload className="size-4" />
            Subir organigrama
          </span>
        )}
      </Button>
    </div>
  )
}
