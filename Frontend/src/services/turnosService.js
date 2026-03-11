import axios from 'axios';
import locationService from './locationService.js';
import { getNearbyPlaces, savePlaces } from './db.js';

// ✅ URL base del backend desde variable de entorno
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api';

class TurnosService {
    constructor() {
        this.subscribers = new Set();
        this.currentState = {
            lugares: [],
            loading: false,
            error: ''
        };
        this.initialized = false;
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        callback(this.currentState);
        return () => this.subscribers.delete(callback);
    }

    notify(newState) {
        this.currentState = { ...this.currentState, ...newState };
        this.subscribers.forEach(callback => {
            try { callback(this.currentState); }
            catch (error) { console.error('Error in turnos subscriber:', error); }
        });
    }

    async initialize() {
        if (this.initialized) return;
        locationService.subscribe(async (location) => {
            if (location) await this.loadNearbyPlaces(location);
        });
        this.initialized = true;
    }

    async loadNearbyPlaces(location) {
        this.notify({ loading: true, error: '' });
        try {
            let places = [];
            try {
                const types = ['hospital', 'clinic', 'doctors', 'veterinary'].join(',');
                // ✅ CORREGIDO: usa API_BASE_URL
                const response = await axios.get(
                    `${API_BASE_URL}/places?lat=${location.lat}&lng=${location.lng}&types=${types}`
                );
                places = this.normalizeApiResponse(response.data);
                if (places.length > 0) {
                    try { await savePlaces(places); } catch (e) { console.warn('[TurnosService] No se pudo guardar cache:', e); }
                }
            } catch (onlineError) {
                console.warn('TurnosService: error fetching online places, falling back to cache', onlineError);
                places = await getNearbyPlaces(location);
            }
            this.notify({ lugares: places, loading: false, error: '' });
        } catch (error) {
            console.error('Error loading places for turnos:', error);
            this.notify({ lugares: [], loading: false, error: 'Error cargando lugares cercanos' });
        }
    }

    normalizeApiResponse(data) {
        let results = [];
        if (Array.isArray(data)) results = data;
        else if (Array.isArray(data.lugares)) results = data.lugares;
        else if (Array.isArray(data.elements)) results = data.elements;
        else if (Array.isArray(data.features)) results = data.features;
        else results = data.elements ?? data.lugares ?? [];
        return results.map(place => ({
            ...place,
            lat: place.lat ?? place.center?.lat ?? place.geometry?.coordinates?.[1],
            lng: place.lng ?? place.lon ?? place.center?.lon ?? place.geometry?.coordinates?.[0],
            type: this.getTypeFromPlace(place)
        }));
    }

    getTypeFromPlace(place) {
        const tags = place.tags ?? place.properties ?? {};
        const amenity = (tags.amenity || tags.healthcare || '').toString().toLowerCase();
        const name = (tags.name || '').toString().toLowerCase();
        if (amenity.includes('hospital') || name.includes('hospital')) return 'hospital';
        if (amenity.includes('clinic') || name.includes('clínica') || name.includes('clinic')) return 'clinic';
        if (amenity.includes('veterinary') || name.includes('veterin')) return 'veterinary';
        if (amenity.includes('doctor') || name.includes('doctor') || name.includes('médic')) return 'doctors';
        return 'default';
    }
}

const turnosService = new TurnosService();

export const saveAppointment = async (payload) => {
        try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // ✅ CORREGIDO: usa API_BASE_URL
        const response = await fetch(`${API_BASE_URL}/turnos`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                usuarioId: payload.usuarioId,
                establecimientoId: payload.establecimientoId,
                especialidadId: payload.especialidadId,
                fecha: payload.fecha,
                hora: payload.hora
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error HTTP: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('[TurnosService] Error guardando turno:', error);
        throw error;
    }
};

export const guardarTurno = async (payload) => saveAppointment(payload);

export const fetchMisTurnos = async (correo) => {
    if (!correo) return [];
    // ✅ CORREGIDO: usa API_BASE_URL
    const res = await axios.get(`${API_BASE_URL}/turnos?user=${encodeURIComponent(correo)}&includeCancelled=true`);
    const data = res.data;
    return Array.isArray(data) ? data : (Array.isArray(data?.turnos) ? data.turnos : []);
};

export const cancelAppointment = async (id) => {
    if (!id) throw new Error('No se pudo cancelar: id de turno inexistente');
    // ✅ CORREGIDO: usa API_BASE_URL
    const res = await axios.put(`${API_BASE_URL}/turnos/${encodeURIComponent(id)}`, { action: 'cancelar' });
    return res;
};

export default turnosService;