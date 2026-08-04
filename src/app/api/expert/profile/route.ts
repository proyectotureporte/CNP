import { NextRequest, NextResponse } from 'next/server';
import { crmUser, expert } from '@/lib/db';
import { actorFromRequest } from '@/lib/auth/caseAccess';
import { uploadFile } from '@/lib/sanity/assets';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { triggerEvent } from '@/lib/realtime/server';

function requireExpert(request: NextRequest) {
  const actor = actorFromRequest(request);
  if (!actor || actor.role !== 'perito') return null;
  return actor;
}

export async function GET(request: NextRequest) {
  try {
    const actor = requireExpert(request);
    if (!actor) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const [user, profile] = await Promise.all([
      crmUser.getUserById(actor.userId),
      expert.getExpertByUserId(actor.userId),
    ]);
    if (!user || !profile) {
      return NextResponse.json({ success: false, error: 'Perfil de perito no configurado' }, { status: 409 });
    }
    return NextResponse.json({
      success: true,
      data: {
        user: { displayName: user.displayName, email: user.email, phone: user.phone },
        expert: {
        ...profile,
          cvFileUrl: undefined,
          certificationUrls: undefined,
          cvDownloadUrl: profile.cvFileUrl ? '/api/expert/profile/cv' : undefined,
        },
      },
    });
  } catch (error) {
    console.error('[expert-profile] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo perfil' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = requireExpert(request);
    if (!actor) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const current = await expert.getExpertByUserId(actor.userId);
    if (!current) return NextResponse.json({ success: false, error: 'Perfil de perito no configurado' }, { status: 409 });

    const form = await request.formData();
    const displayName = String(form.get('displayName') || '').trim();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const phone = String(form.get('phone') || '').trim();
    const bankName = String(form.get('bankName') || '').trim();
    const bankAccountType = String(form.get('bankAccountType') || '');
    const bankAccountNumber = String(form.get('bankAccountNumber') || '').trim();
    const bankAccountHolder = String(form.get('bankAccountHolder') || '').trim();
    const bankHolderDocument = String(form.get('bankHolderDocument') || '').trim();
    const city = String(form.get('city') || '').trim();
    const region = String(form.get('region') || '').trim();
    const availability = String(form.get('availability') || current.availability);
    const cv = form.get('cv');

    if (!displayName || !email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Nombre y correo válidos son obligatorios' }, { status: 400 });
    }
    if (!['ahorros', 'corriente'].includes(bankAccountType)) {
      return NextResponse.json({ success: false, error: 'Selecciona el tipo de cuenta' }, { status: 400 });
    }
    if (!['disponible', 'ocupado', 'no_disponible'].includes(availability)) {
      return NextResponse.json({ success: false, error: 'Disponibilidad inválida' }, { status: 400 });
    }

    let cvPatch: Parameters<typeof expert.updateExpert>[1] = {};
    const cvChanged = cv instanceof File && cv.size > 0;
    if (cvChanged) {
      if (cv.size > 15 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'La hoja de vida supera 15 MB' }, { status: 400 });
      }
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowed.includes(cv.type) && !/\.(pdf|doc|docx)$/i.test(cv.name)) {
        return NextResponse.json({ success: false, error: 'La hoja de vida debe ser PDF, DOC o DOCX' }, { status: 400 });
      }
      const asset = await uploadFile(
        Buffer.from(await cv.arrayBuffer()),
        cv.name,
        cv.type || 'application/octet-stream',
      );
      cvPatch = {
        cvFileUrl: asset.url,
        cvFileAssetId: asset.assetId,
        cvFileName: asset.originalFilename || cv.name,
        cvMimeType: asset.mimeType,
        cvFileSize: asset.size,
        validationStatus: 'en_evaluacion',
        seniority: null,
        category: null,
        validatedById: null,
        validationNotes: 'Hoja de vida actualizada por el perito; requiere nueva categorización.',
      };
    }

    await crmUser.updateUser(actor.userId, { displayName, email, phone });
    const updated = await expert.updateExpert(current._id, {
      city,
      region,
      availability: availability as typeof current.availability,
      bankName,
      bankAccountType: bankAccountType as 'ahorros' | 'corriente',
      bankAccountNumber,
      bankAccountHolder,
      bankHolderDocument,
      ...cvPatch,
    });

    if (cvChanged) {
      await notifyUsersAndAdmins({
        userIds: [],
        title: 'Hoja de vida de perito pendiente de recategorización',
        message: `${displayName} actualizó su hoja de vida. El perfil volvió a En evaluación y requiere clasificación.`,
        type: 'warning',
        priority: 'alta',
        linkUrl: `/crm/experts/${current._id}`,
        mailbox: 'admin',
      });
    }
    triggerEvent('expert:updated', { id: current._id, selfService: true, cvChanged });
    return NextResponse.json({
      success: true,
      data: updated && {
        ...updated,
        cvFileUrl: undefined,
        certificationUrls: undefined,
        cvDownloadUrl: updated.cvFileUrl ? '/api/expert/profile/cv' : undefined,
      },
      message: cvChanged
        ? 'Perfil actualizado. La hoja de vida quedó en evaluación para nueva categorización.'
        : 'Perfil actualizado correctamente.',
    });
  } catch (error) {
    console.error('[expert-profile] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Error actualizando perfil' }, { status: 500 });
  }
}
