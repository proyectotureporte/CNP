// Puente hacia las métricas propias (https://restaurar.co/m.js). Si el script
// no cargó (bloqueador, sin red) simplemente no hace nada.
type RestaurarTrack = (name: string, meta?: Record<string, string | number | boolean>) => void;

export function trackLead(form: string): void {
  try {
    (window as unknown as { restaurarTrack?: RestaurarTrack }).restaurarTrack?.('lead', { form });
  } catch {
    /* la analítica nunca rompe el formulario */
  }
}
