import { supabase } from '../lib/supabaseClient'

const obtenerHeadersAutenticados = async (incluyeJson = false) => {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Debes iniciar sesión para acceder a los lotes.')
  }

  return {
    ...(incluyeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${data.session.access_token}`,
  }
}

export const loteService = {
  obtenerLotes: async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/lotes', {
        headers: await obtenerHeadersAutenticados(),
      });
      if (!respuesta.ok) throw new Error('Error en la red');
      return await respuesta.json();
    } catch (error) {
      console.error('Error al obtener los lotes:', error);
      return [];
    }
  },

  registrarEntrada: async (datosLote) => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/lotes/entrada', {
        method: 'POST',
        headers: await obtenerHeadersAutenticados(true),
        body: JSON.stringify(datosLote),
      });
      return await respuesta.json();
    } catch (error) {
      console.error('Error al registrar la entrada:', error);
      throw error;
    }
  }
};