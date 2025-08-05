"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { ChevronDownIcon, ChevronUpIcon, Loader2 } from "lucide-react"

// Tipos para las respuestas de la API
interface SubmitResponse {
  jobId: string
}

interface ResultResponse {
  estado: "PENDIENTE" | "PROCESANDO" | "COMPLETADO" | "ERROR";
  resultado?: {
    sentimiento: "positivo" | "negativo" | "neutral";
    palabrasClave: string[];
  };
  texto: string;
}

// Estados de la aplicación
type AppState = "formulario" | "procesando" | "resultados" | "error"

const API_BASE_URL = process.env.VITE_API_URL;

export default function AnalytiCore() {
  const [appState, setAppState] = useState<AppState>("formulario")
  const [texto, setTexto] = useState("")
  const [jobId, setJobId] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{
  sentimiento?: string;
  palabrasClave?: string[];
  texto_original?: string;
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTextCollapsed, setIsTextCollapsed] = useState(true)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const maxChars = 5000
  const minChars = 10

  // Validación del texto
  const isTextValid = texto.length >= minChars && texto.length <= maxChars
  const charCount = texto.length
  const charCountColor =
    charCount > maxChars ? "text-red-500" : charCount < minChars ? "text-gray-400" : "text-green-600"

  // Enviar texto para análisis
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isTextValid || texto.trim().length === 0) return

    try {
      setAppState("procesando")
      setError(null)

      const response = await axios.post<SubmitResponse>(`${API_BASE_URL}/submit`, {
        texto: texto.trim(),
      })

      setJobId(response.data.jobId)
      startPolling(response.data.jobId)
    } catch (err) {
      console.error("Error al enviar texto:", err)
      setError("Error al conectar con el servidor. Verifica que el backend esté ejecutándose.")
      setAppState("error")
    }
  }

  // Iniciar polling para verificar el estado
  const startPolling = (jobId: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const response = await axios.get<ResultResponse>(`${API_BASE_URL}/status/${jobId}`)
        const data = response.data

        if (data.estado === "COMPLETADO") {
          const { resultado } = data;
          setResultado({
            sentimiento: resultado?.sentimiento,
            palabrasClave: resultado?.palabrasClave,
            texto_original: data.texto
          });
          setAppState("resultados");
          stopPolling();
        } else if (data.estado === "ERROR") {
          setError("Error durante el análisis del texto")
          setAppState("error")
          stopPolling()
        }
        // Si está PENDIENTE o PROCESANDO, continúa el polling
      } catch (err) {
        console.error("Error en polling:", err)
        setError("Error de conexión durante el análisis")
        setAppState("error")
        stopPolling()
      }
    }, 2000)
  }

  // Detener polling
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // Reiniciar a formulario
  const resetToForm = () => {
    stopPolling()
    setAppState("formulario")
    setTexto("")
    setJobId(null)
    setResultado(null)
    setError(null)
    setIsTextCollapsed(true)
  }

  // Reintentar análisis
  const handleRetry = () => {
    setAppState("formulario")
    setError(null)
    setJobId(null)
  }

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => stopPolling()
  }, [])

  // Obtener configuración visual para sentimiento
  const getSentimentConfig = (sentimiento: string) => {
    switch (sentimiento) {
      case "positivo":
        return {
          emoji: "😊",
          color: "bg-green-500",
          textColor: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        }
      case "negativo":
        return {
          emoji: "😟",
          color: "bg-red-500",
          textColor: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        }
      case "neutral":
        return {
          emoji: "😐",
          color: "bg-yellow-500",
          textColor: "text-yellow-700",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        }
      default:
        return {
          emoji: "❓",
          color: "bg-gray-500",
          textColor: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <span className="text-3xl font-bold text-white">AC</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            AnalytiCore
          </h1>
          <p className="text-xl text-gray-600 font-medium">Análisis Inteligente de Texto</p>
        </header>

        {/* Estado: Formulario */}
        {appState === "formulario" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 transition-all duration-500 hover:shadow-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="texto-input" className="block text-lg font-semibold text-gray-800 mb-3">
                  Texto a analizar
                </label>
                <div className="relative">
                  <textarea
                    id="texto-input"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribe aquí el texto que quieres analizar..."
                    rows={6}
                    className={`w-full px-5 py-4 border-2 rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-700 placeholder-gray-400 ${
                      charCount > maxChars
                        ? "border-red-300 focus:border-red-500 bg-red-50/50"
                        : "border-gray-200 focus:border-blue-500 bg-white"
                    }`}
                    style={{ minHeight: "150px", maxHeight: "300px" }}
                  />
                  <div
                    className={`absolute bottom-4 right-4 text-sm font-semibold ${charCountColor} bg-white/90 px-2 py-1 rounded-lg`}
                  >
                    {charCount}/{maxChars}
                  </div>
                </div>

                {charCount < minChars && charCount > 0 && (
                  <p className="text-sm text-red-500 mt-2 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Mínimo {minChars} caracteres requeridos
                  </p>
                )}
                {charCount > maxChars && (
                  <p className="text-sm text-red-500 mt-2 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Máximo {maxChars} caracteres permitidos
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isTextValid || texto.trim().length === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-xl hover:shadow-2xl disabled:shadow-md"
              >
                <span className="flex items-center justify-center">Analizar Texto</span>
              </button>
            </form>
          </div>
        )}

        {/* Estado: Procesando */}
        {appState === "procesando" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 text-center transition-all duration-500">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Analizando tu texto...</h2>
              <p className="text-gray-600 text-lg">Por favor espera mientras procesamos tu solicitud</p>
            </div>

            {jobId && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
                <p className="text-sm text-gray-600 mb-2 font-medium">ID de análisis:</p>
                <p className="font-mono text-xl font-bold text-blue-600">#{jobId}</p>
              </div>
            )}

            <div className="flex justify-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div
                  className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Estado: Resultados */}
        {appState === "resultados" && resultado && (
          <div className="space-y-6 transition-all duration-500">
            {/* Badge de Sentimiento */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
              <div className="mb-8">
                <div
                  className={`inline-flex items-center justify-center w-24 h-24 ${getSentimentConfig(resultado.sentimiento!).color} rounded-full mb-6 shadow-xl`}
                >
                  <span className="text-4xl">{getSentimentConfig(resultado.sentimiento!).emoji}</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-3">
                  Sentimiento:{" "}
                  <span className={`${getSentimentConfig(resultado.sentimiento!).textColor} capitalize`}>
                    {resultado.sentimiento}
                  </span>
                </h2>
                <p className="text-gray-600 text-lg">Análisis completado exitosamente</p>
                <p className="text-center text-2xl font-bold text-blue-500">
                  {resultado?.sentimiento}
                </p>
              </div>
            </div>

            {/* Palabras Clave */}
            {resultado.palabrasClave && resultado.palabrasClave.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  Palabras Clave
                </h3>
                <div className="flex flex-wrap gap-3">
                  {resultado.palabrasClave.map((palabra, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 transform hover:scale-105"
                    >
                      {palabra}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Texto Original */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <button
                onClick={() => setIsTextCollapsed(!isTextCollapsed)}
                className="flex items-center justify-between w-full text-left hover:bg-gray-50/50 rounded-xl p-2 -m-2 transition-colors duration-200"
              >
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  Texto Original
                </h3>
                <div className="p-2">
                  {isTextCollapsed ? (
                    <ChevronDownIcon className="w-6 h-6 text-gray-500" />
                  ) : (
                    <ChevronUpIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${isTextCollapsed ? "max-h-0" : "max-h-96"}`}
              >
                <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {resultado.texto_original || texto}
                  </p>
                </div>
              </div>
            </div>

            {/* Botón Nuevo Análisis */}
            <div className="text-center pt-4">
              <button
                onClick={resetToForm}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                Analizar Otro Texto
              </button>
            </div>
          </div>
        )}

        {/* Estado: Error */}
        {appState === "error" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 text-center transition-all duration-500">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Error en el Análisis</h2>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                <p className="text-red-700 text-lg font-medium">
                  {error || "Ha ocurrido un error inesperado durante el análisis"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Reintentar
              </button>
              <button
                onClick={resetToForm}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
