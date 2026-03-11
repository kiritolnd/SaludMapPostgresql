import axios from 'axios';

// ✅ URL base del backend desde variable de entorno
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api';

/**
 * Obtiene todas las especialidades disponibles
 */
export const getEspecialidades = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/especialidades`);
        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error('[EspecialidadesService] Error obteniendo especialidades:', error);
        throw error;
    }
};

/**
 * Obtiene las especialidades de un establecimiento específico
 */
export const getEspecialidadesByEstablecimiento = async (establecimientoId) => {
    if (!establecimientoId) return [];
    try {
        const res = await axios.get(`${API_BASE_URL}/especialidades/establecimiento/${establecimientoId}`);
        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error('[EspecialidadesService] Error obteniendo especialidades del establecimiento:', error);
        throw error;
    }
};

/**
 * Obtiene la disponibilidad (horarios) de una especialidad en un establecimiento
 */
export const getDisponibilidad = async (especialidadId, establecimientoId) => {
    if (!especialidadId || !establecimientoId) return null;
    try {
        const res = await axios.get(`${API_BASE_URL}/especialidades/establecimiento/${establecimientoId}`);
        const lista = Array.isArray(res.data) ? res.data : [];
        const encontrada = lista.find(e => e.id === especialidadId);
        return encontrada || null;
    } catch (error) {
        console.error('[EspecialidadesService] Error obteniendo disponibilidad:', error);
        throw error;
    }
};

const especialidadesService = {
    getEspecialidades,
    getEspecialidadesByEstablecimiento,
    getDisponibilidad,
};

export default especialidadesService;