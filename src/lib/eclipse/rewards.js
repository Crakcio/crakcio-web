// lib/eclipse/rewards.js

export class RewardSystem {
  constructor() {
    this.pointsEarned = 0;
    this.pointsPerMinute = 10; // 10 CrakcioPoints por minuto sobrevivido
  }

  calculatePoints(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    this.pointsEarned = minutes * this.pointsPerMinute;
    return this.pointsEarned;
  }

  // Función para sincronizar los puntos con la API/Supabase de Crakcio Store
  async syncPointsWithSupabase(userId, points) {
    if (!userId || points <= 0) return { success: false, reason: 'Sin puntos que reclamar' };

    try {
      // Ejemplo de endpoint en tu tienda para procesar los CrakcioPoints
      const response = await fetch('/api/user/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          pointsToAdd: points,
          source: 'ECLIPSE_ZONA_CERO',
        }),
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor');

      const data = await response.json();
      return { success: true, newTotal: data.newTotal };
    } catch (error) {
      console.error('Error al guardar CrakcioPoints:', error);
      return { success: false, error };
    }
  }
}