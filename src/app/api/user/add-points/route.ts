// app/api/user/add-points/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Ajusta la ruta a tu cliente de Supabase

export async function POST(request: Request) {
  try {
    const { userId, pointsToAdd, source } = await request.json();

    if (!userId || !pointsToAdd || pointsToAdd <= 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // 1. Obtener puntos actuales del usuario
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('crakcio_points')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const currentPoints = user.crakcio_points || 0;
    const newTotal = currentPoints + pointsToAdd;

    // 2. Actualizar puntos en la base de datos
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ crakcio_points: newTotal })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // 3. Registrar el historial de la transacción
    await supabase.from('points_history').insert([
      {
        user_id: userId,
        amount: pointsToAdd,
        source: source || 'ECLIPSE_GAME',
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, newTotal });
  } catch (error: any) {
    console.error('Error al actualizar CrakcioPoints:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}