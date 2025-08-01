import React, { useState } from 'react'
import { Building, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp } = useAuth()

  const getErrorMessage = (error: any) => {
    if (!error) return ''
    
    const message = error.message || error.toString()
    
    // Handle specific Supabase error codes
    if (message.includes('Invalid login credentials')) {
      return 'Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.'
    }
    
    if (message.includes('Email not confirmed')) {
      return 'Votre email n\'est pas encore confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.'
    }
    
    if (message.includes('User already registered')) {
      return 'Un compte existe déjà avec cette adresse email. Essayez de vous connecter.'
    }
    
    if (message.includes('Password should be at least')) {
      return 'Le mot de passe doit contenir au moins 6 caractères.'
    }
    
    if (message.includes('Unable to validate email address')) {
      return 'Adresse email invalide. Vérifiez le format de votre email.'
    }
    
    if (message.includes('signup is disabled')) {
      return 'Les inscriptions sont temporairement désactivées. Contactez l\'administrateur.'
    }
    
    // Default error message
    return 'Une erreur est survenue. Veuillez réessayer ou contacter le support.'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          setError(getErrorMessage(error))
        }
      } else {
        const { error } = await signUp(email, password)
        if (error) {
          setError(getErrorMessage(error))
        } else {
          setSuccess('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte, puis connectez-vous.')
          setIsLogin(true)
          setPassword('')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('Une erreur inattendue est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">IMMOLOC</h1>
          <p className="text-slate-400">Gestion Immobilière Locative</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </h2>
            <p className="text-gray-600">
              {isLogin 
                ? 'Connectez-vous à votre espace personnel' 
                : 'Créez votre compte pour commencer'
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-green-700 text-sm leading-relaxed">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="votre@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
                {!isLogin && (
                  <span className="text-gray-500 font-normal"> (minimum 6 caractères)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {isLogin ? 'Connexion...' : 'Création...'}
                </>
              ) : (
                isLogin ? 'Se connecter' : 'Créer le compte'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:text-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLogin 
                ? "Pas encore de compte ? Créer un compte" 
                : "Déjà un compte ? Se connecter"
              }
            </button>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Problème de connexion ? Vérifiez que votre email est confirmé.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage