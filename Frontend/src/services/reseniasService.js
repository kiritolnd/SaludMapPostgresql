import axios from 'axios';

// ✅ URL base del backend desde variable de entorno
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api';

class ReseniasService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL, // ✅ CORREGIDO: era 'http://localhost:3000/api'
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token a todas las peticiones
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async validarPuedeReseniar(turnoId) {
    try {
      const response = await this.api.get(`/resenias/validar/${turnoId}`);
      return response.data;
    } catch (error) {
      console.error('Error validando reseña:', error);
      throw error;
    }
  }

  async crearResenia(turnoId, establecimientoId, puntuacion, comentario) {
    try {
      const response = await this.api.post('/resenias', {
        turnoId, establecimientoId, puntuacion, comentario,
      });
      return response.data;
    } catch (error) {
      console.error('Error creando reseña:', error);
      throw error;
    }
  }

  async obtenerResenias(establecimientoId) {
    try {
      const response = await this.api.get(`/resenias/establecimiento/${establecimientoId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reseñas:', error);
      return [];
    }
  }

  async misResenias() {
    try {
      const response = await this.api.get('/resenias/mis-resenias');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mis reseñas:', error);
      return [];
    }
  }

  async getTurnosParaReseniar(establecimientoId) {
    try {
      const response = await this.api.get('/resenias/turnos-para-reseniar', {
        params: { establecimientoId }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener turnos:', error);
      throw error;
    }
  }

  async obtenerResenia(id) {
    try {
      const response = await this.api.get(`/resenias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reseña:', error);
      throw error;
    }
  }
}

const reseniasService = new ReseniasService();
export default reseniasService;