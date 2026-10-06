import { NextRequest, NextResponse } from 'next/server';
import { crmUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth/passwords';
import { triggerEvent } from '@/lib/realtime/server';
import { USER_ROLES, type UserRole } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await crmUser.getUserById(id);
  if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
  return NextResponse.json({ success: true, data: user });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const current = await crmUser.getUserById(id);
    if (!current) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });

    const body = await request.json();
    const displayName = String(body.displayName || '').trim();
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');
    const role = body.role as UserRole;

    if (displayName.length < 2 || displayName.length > 120 || username.length < 2 || username.length > 100) {
      return NextResponse.json({ success: false, error: 'Revisa el nombre y el nombre de usuario' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || phone.length > 50) {
      return NextResponse.json({ success: false, error: 'Email o teléfono no válido' }, { status: 400 });
    }
    if (!USER_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'Rol no válido' }, { status: 400 });
    }
    const protectedAccountRole = current.role === 'admin' || current.role === 'cliente';
    if ((protectedAccountRole && role !== current.role) || (!protectedAccountRole && (role === 'admin' || role === 'cliente'))) {
      return NextResponse.json(
        { success: false, error: 'Las cuentas admin y cliente conservan su rol para no romper sus vínculos de acceso' },
        { status: 400 },
      );
    }
    if (password && password.length < 8) {
      return NextResponse.json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }
    if (await crmUser.getAnyUserByEmail(email, id)) {
      return NextResponse.json({ success: false, error: 'El email ya pertenece a otro usuario' }, { status: 409 });
    }
    if (await crmUser.getAnyUserByUsername(username, id)) {
      return NextResponse.json({ success: false, error: 'El nombre de usuario ya pertenece a otro usuario' }, { status: 409 });
    }

    const updated = await crmUser.updateUser(id, {
      displayName,
      username,
      email,
      phone,
      role,
      passwordHash: password ? await hashPassword(password) : undefined,
    });
    triggerEvent('user:updated', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error PUT /api/admin/users/[id]:', error);
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ success: false, error: 'El email o nombre de usuario ya está registrado' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error actualizando usuario' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const current = await crmUser.getUserById(id);
    if (!current) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    const body = await request.json();
    if (typeof body.active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Estado no válido' }, { status: 400 });
    }
    if (body.active) {
      const duplicate = await crmUser.getAnyUserByEmail(current.email, id);
      if (duplicate?.active) {
        return NextResponse.json({ success: false, error: 'Ya existe otra cuenta activa con este email' }, { status: 409 });
      }
    }
    const updated = await crmUser.updateUser(id, { active: body.active });
    triggerEvent('user:updated', { id });
    return NextResponse.json({
      success: true,
      data: updated,
      message: body.active ? 'Usuario activado' : 'Usuario desactivado',
    });
  } catch (error) {
    console.error('Error PATCH /api/admin/users/[id]:', error);
    return NextResponse.json({ success: false, error: 'Error actualizando el estado del usuario' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await crmUser.updateUser(id, { active: false });

    triggerEvent('user:updated', { id });

    return NextResponse.json({ success: true, data: { message: 'Usuario desactivado' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error desactivando usuario' }, { status: 500 });
  }
}
