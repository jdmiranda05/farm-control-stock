export const loteService = {
  obtenerLotes: async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/lotes');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosLote),
      });
      return await respuesta.json();
    } catch (error) {
      console.error('Error al registrar la entrada:', error);
      throw error;
    }
  }
};