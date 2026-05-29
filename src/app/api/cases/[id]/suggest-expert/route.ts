import { NextRequest, NextResponse } from 'next/server';
import { cases, expert } from '@/lib/db';
import type { Expert } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';

interface ScoredExpert extends Expert {
  score: number;
  scoreBreakdown: {
    rating: number;
    availability: number;
    experience: number;
    location: number;
    completedCases: number;
  };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caseData = await cases.getCaseById(id);
    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    if (!caseData.discipline) {
      return NextResponse.json(
        { success: false, error: 'El caso no tiene disciplina definida' },
        { status: 400 }
      );
    }

    const experts = await expert.listAvailableExpertsForDiscipline(caseData.discipline);

    if (experts.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No hay peritos disponibles para esta disciplina',
      });
    }

    // Score: rating (40%) + availability (20%) + experience (20%) + location (10%) + completed cases (10%)
    const maxExperience = Math.max(...experts.map((e) => e.experienceYears || 0), 1);
    const maxCompleted = Math.max(...experts.map((e) => e.completedCases || 0), 1);

    const scored: ScoredExpert[] = experts.map((exp) => {
      const ratingScore = ((exp.rating || 0) / 5) * 40;
      const availabilityScore = exp.availability === 'disponible' ? 20 : 0;
      const experienceScore = ((exp.experienceYears || 0) / maxExperience) * 20;
      const locationScore =
        caseData.city && exp.city && exp.city.toLowerCase() === caseData.city.toLowerCase() ? 10 : 0;
      const completedScore = ((exp.completedCases || 0) / maxCompleted) * 10;

      const score = ratingScore + availabilityScore + experienceScore + locationScore + completedScore;

      return {
        ...exp,
        score: Math.round(score * 10) / 10,
        scoreBreakdown: {
          rating: Math.round(ratingScore * 10) / 10,
          availability: availabilityScore,
          experience: Math.round(experienceScore * 10) / 10,
          location: locationScore,
          completedCases: Math.round(completedScore * 10) / 10,
        },
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3);

    triggerEvent('case:updated', { id });

    return NextResponse.json({ success: true, data: top3 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error sugiriendo peritos' },
      { status: 500 }
    );
  }
}
