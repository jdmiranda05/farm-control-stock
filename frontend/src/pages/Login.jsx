import { useState } from 'react'
import keyRoundIcon from '../assets/login/key-round.svg'
import eyeOffIcon from '../assets/login/eye-off.svg'
import checkIcon from '../assets/login/check.svg'

const DEFAULT_EMAIL = 'admin@boticamll.com'

export const Login = ({ onLogin }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('farm_login_email') || DEFAULT_EMAIL)
  const [password, setPassword] = useState('Admin12345')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')
    setIsSubmitting(true)

    try {
      await onLogin({ email: email.trim(), password })

      if (remember) {
        localStorage.setItem('farm_login_email', email.trim())
      } else {
        localStorage.removeItem('farm_login_email')
      }
    } catch (error) {
      const message = /api key/i.test(error.message)
        ? 'La clave publica de Supabase no es valida. Revisa VITE_SUPABASE_PUBLISHABLE_KEY.'
        : error.message || 'No se pudo iniciar sesion. Revisa tus credenciales.'

      setFeedback(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-screen" data-node-id="10:4">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <header className="login-card-header">
          <span className="login-icon" aria-hidden="true">
            <img src={keyRoundIcon} alt="" />
          </span>
          <span className="login-copy">
            <h1>Bienvenido</h1>
            <p>Por favor ingresa tus credenciales</p>
          </span>
        </header>

        <section className="login-form-section" aria-label="Formulario de acceso">
          <label className="login-field login-field-email">
            <span>Correo electronico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="login-field">
            <span>Contrasena</span>
            <div className="password-control">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                className="icon-button"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                <img src={eyeOffIcon} alt="" />
              </button>
            </div>
          </label>

          <div className="login-options">
            <label className="remember-control">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span className="checkmark" aria-hidden="true">
                <img src={checkIcon} alt="" />
              </span>
              <span>Recordar contrasena</span>
            </label>
            <button className="link-button" type="button" onClick={() => setFeedback('Solicita recuperacion al administrador del sistema.')}>
              Olvide mi contrasena?
            </button>
          </div>
        </section>

        <button className="login-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Validando...' : 'Iniciar Sesion'}
        </button>

        <p className="login-feedback" role="status" aria-live="polite">
          {feedback}
        </p>

        <footer className="login-footer">
          <span>No tengo una cuenta?</span>
          <button className="link-button" type="button" onClick={() => setFeedback('El registro lo gestiona el administrador del sistema.')}>
            Registrarse aqui.
          </button>
        </footer>
      </form>
    </main>
  )
}
